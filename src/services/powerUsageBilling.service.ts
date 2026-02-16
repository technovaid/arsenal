import clickhouseClient from '../config/clickhouse';
import logger from '../utils/logger';

// Tarif listrik PLN per kWh (dalam Rupiah) - bisa disesuaikan
const TARIF_PLN_PER_KWH = 1444.70; // Tarif golongan bisnis B2

export interface PowerUsageBillingSite {
  siteId: string;
  siteName: string;
  region: string;
  nop: string;
  regency: string;
  payloadLevel: 'Low' | 'Medium' | 'High';
  powerVa: number;
  cells: string;
  type: 'AMR' | 'NON-AMR';
  predictedKwh: number;
  actualKwh: number;
  predictedBill: number;
  actualBill: number;
  deviationPct: number;
  outlierType: 'Valid' | 'Over' | 'Under';
  anomalyStatus: 'Normal' | 'High' | 'Critical';
  lastUpdated: string;
  latitude: number;
  longitude: number;
  clusterAverageKwh: number;
  clusterAverageBill: number;
  predictionAccuracyPct: number;
  dayaCluster: string;
  config: {
    totalPayload: number;
    dayaVa: number;
    totalVlrSubs: number;
    siteSimpul: boolean;
    active5g: number;
    bw5g: number;
    active4g: number;
    bw4g: number;
    active2g: number;
    bw2g: number;
  };
}

export interface MonthlySeriesPoint {
  m: string;
  predicted: number;
  actual: number;
}

export interface PowerUsageBillingFilters {
  region?: string;
  nop?: string;
  regency?: string;
  powerRange?: string;
  payloadLevel?: string;
  outlierType?: string;
  yearmonth?: number;
}

export interface PowerUsageBillingSummary {
  totalSites: number;
  anomalySites: number;
  overPredictionCount: number;
  underPredictionCount: number;
  validCount: number;
  anomalyRate: number;
  avgPredictedKwh: number;
  avgActualKwh: number;
  avgPredictedBill: number;
  avgActualBill: number;
  avgDeviationPct: number;
}

export interface ClusterSummary {
  dayaCluster: string;
  totalSites: number;
  avgR2: number;
  avgRmse: number;
  avgMae: number;
  avgMape: number;
}

class PowerUsageBillingService {
  /**
   * Get all sites with power usage billing data
   */
  async getSites(filters: PowerUsageBillingFilters = {}): Promise<PowerUsageBillingSite[]> {
    try {
      const yearmonth = filters.yearmonth || await this.getLatestYearmonth();
      
      // Build WHERE clauses
      const whereClauses: string[] = [`p.yearmonth = ${yearmonth}`];
      
      if (filters.region && filters.region !== 'All Region') {
        whereClauses.push(`s.provinsi = '${filters.region}'`);
      }
      if (filters.nop && filters.nop !== 'All NOP') {
        whereClauses.push(`s.nop = '${filters.nop}'`);
      }
      if (filters.regency && filters.regency !== 'All Regency') {
        whereClauses.push(`s.kabupaten_kota = '${filters.regency}'`);
      }

      const whereClause = whereClauses.length > 0 ? `WHERE ${whereClauses.join(' AND ')}` : '';

      const query = `
        SELECT
          p.site_id as siteId,
          coalesce(s.site_name, p.site_id) as siteName,
          coalesce(s.provinsi, 'Unknown') as region,
          coalesce(s.nop, 'Unknown') as nop,
          coalesce(s.kabupaten_kota, 'Unknown') as regency,
          coalesce(s.latitude, 0) as latitude,
          coalesce(s.longitude, 0) as longitude,
          p.predicted_kwh as predictedKwh,
          coalesce(p.actual_kwh, p.predicted_kwh) as actualKwh,
          p.daya_cluster as dayaCluster,
          p.model_version as modelVersion,
          p.yearmonth,
          f.daya_va as dayaVa,
          f.total_payload_mbyte as totalPayload,
          f.total_vlr_subs as totalVlrSubs,
          f.site_simpul_encoded as siteSimpul,
          f.active_cells_2g as active2g,
          f.active_cells_4g as active4g,
          f.active_cells_5g as active5g,
          f.bandwidth_2g as bw2g,
          f.bandwidth_4g as bw4g,
          f.bandwidth_5g as bw5g,
          f.total_active_cells as totalCells,
          f.total_bandwidth as totalBandwidth
        FROM gold.kwh_predictions_v0 p
        LEFT JOIN gold.site_attributes s ON p.site_id = s.site_id
        LEFT JOIN gold.kwh_prediction_features f ON p.site_id = f.site_id AND p.yearmonth = f.yearmonth
        ${whereClause}
        ORDER BY p.predicted_kwh DESC
        LIMIT 1000
      `;

      logger.info(`PowerUsageBilling getSites query for yearmonth=${yearmonth}:`, { query: query.trim() });

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const rawData = await result.json<any[]>();
      
      logger.info(`PowerUsageBilling getSites returned ${rawData.length} rows for yearmonth=${yearmonth}`);
      if (rawData.length > 0) {
        logger.info(`Sample row:`, { sample: rawData[0] });
      }
      
      // Get cluster averages
      const clusterAverages = await this.getClusterAverages(yearmonth);

      // Transform data
      const sites: PowerUsageBillingSite[] = rawData.map((row) => {
        const predictedKwh = Number(row.predictedKwh) || 0;
        const actualKwh = Number(row.actualKwh) || predictedKwh;
        const predictedBill = predictedKwh * TARIF_PLN_PER_KWH;
        const actualBill = actualKwh * TARIF_PLN_PER_KWH;
        const deviationPct = predictedKwh > 0 ? ((actualKwh - predictedKwh) / predictedKwh) * 100 : 0;
        const dayaVa = Number(row.dayaVa) || 0;
        const totalPayload = Number(row.totalPayload) || 0;

        // Determine outlier type
        let outlierType: 'Valid' | 'Over' | 'Under' = 'Valid';
        if (deviationPct > 10) outlierType = 'Over';
        else if (deviationPct < -10) outlierType = 'Under';

        // Determine anomaly status
        let anomalyStatus: 'Normal' | 'High' | 'Critical' = 'Normal';
        const absDeviation = Math.abs(deviationPct);
        if (absDeviation > 15) anomalyStatus = 'Critical';
        else if (absDeviation > 10) anomalyStatus = 'High';

        // Determine payload level
        let payloadLevel: 'Low' | 'Medium' | 'High' = 'Medium';
        if (totalPayload < 1000) payloadLevel = 'Low';
        else if (totalPayload > 3000) payloadLevel = 'High';

        // Determine power range
        const powerRange = dayaVa >= 53000 ? '>= 53.000 VA' : '< 53.000 VA';

        // Get cluster average
        const clusterAvg = clusterAverages.get(row.dayaCluster) || { avgKwh: predictedKwh, avgBill: predictedBill };

        // Format cells string
        const cells = `${row.active2g || 0} / ${row.active4g || 0} / ${row.active5g || 0}`;

        // Format yearmonth to date string
        const yearmonthStr = String(row.yearmonth);
        const year = yearmonthStr.substring(0, 4);
        const month = yearmonthStr.substring(4, 6);
        const lastUpdated = `${year}-${month}-01`;

        return {
          siteId: row.siteId,
          siteName: row.siteName,
          region: row.region,
          nop: row.nop,
          regency: row.regency,
          payloadLevel,
          powerVa: dayaVa,
          cells,
          type: 'AMR' as const,
          predictedKwh,
          actualKwh,
          predictedBill: Math.round(predictedBill),
          actualBill: Math.round(actualBill),
          deviationPct: Math.round(deviationPct * 10) / 10,
          outlierType,
          anomalyStatus,
          lastUpdated,
          latitude: Number(row.latitude) || 0,
          longitude: Number(row.longitude) || 0,
          clusterAverageKwh: clusterAvg.avgKwh,
          clusterAverageBill: Math.round(clusterAvg.avgBill),
          predictionAccuracyPct: Math.max(0, 100 - absDeviation),
          dayaCluster: row.dayaCluster,
          config: {
            totalPayload,
            dayaVa,
            totalVlrSubs: Number(row.totalVlrSubs) || 0,
            siteSimpul: row.siteSimpul === 1,
            active5g: Number(row.active5g) || 0,
            bw5g: Number(row.bw5g) || 0,
            active4g: Number(row.active4g) || 0,
            bw4g: Number(row.bw4g) || 0,
            active2g: Number(row.active2g) || 0,
            bw2g: Number(row.bw2g) || 0,
          },
        };
      });

      // Apply additional filters
      let filteredSites = sites;

      if (filters.powerRange && filters.powerRange !== 'All Range') {
        filteredSites = filteredSites.filter((s) => {
          if (filters.powerRange === '< 53.000 VA') return s.powerVa < 53000;
          if (filters.powerRange === '>= 53.000 VA') return s.powerVa >= 53000;
          return true;
        });
      }

      if (filters.payloadLevel && filters.payloadLevel !== 'All Payload') {
        filteredSites = filteredSites.filter((s) => s.payloadLevel === filters.payloadLevel);
      }

      if (filters.outlierType && filters.outlierType !== 'All Outlier') {
        filteredSites = filteredSites.filter((s) => s.outlierType === filters.outlierType);
      }

      return filteredSites;
    } catch (error) {
      logger.error('Error fetching power usage billing sites:', error);
      throw error;
    }
  }

  /**
   * Get summary statistics
   */
  async getSummary(filters: PowerUsageBillingFilters = {}): Promise<PowerUsageBillingSummary> {
    try {
      const sites = await this.getSites(filters);

      const totalSites = sites.length;
      const anomalySites = sites.filter((s) => s.anomalyStatus !== 'Normal').length;
      const overPredictionCount = sites.filter((s) => s.outlierType === 'Over').length;
      const underPredictionCount = sites.filter((s) => s.outlierType === 'Under').length;
      const validCount = sites.filter((s) => s.outlierType === 'Valid').length;
      const anomalyRate = totalSites > 0 ? (anomalySites / totalSites) * 100 : 0;

      const avgPredictedKwh = totalSites > 0 ? sites.reduce((sum, s) => sum + s.predictedKwh, 0) / totalSites : 0;
      const avgActualKwh = totalSites > 0 ? sites.reduce((sum, s) => sum + s.actualKwh, 0) / totalSites : 0;
      const avgPredictedBill = totalSites > 0 ? sites.reduce((sum, s) => sum + s.predictedBill, 0) / totalSites : 0;
      const avgActualBill = totalSites > 0 ? sites.reduce((sum, s) => sum + s.actualBill, 0) / totalSites : 0;
      const avgDeviationPct = totalSites > 0 ? sites.reduce((sum, s) => sum + s.deviationPct, 0) / totalSites : 0;

      return {
        totalSites,
        anomalySites,
        overPredictionCount,
        underPredictionCount,
        validCount,
        anomalyRate: Math.round(anomalyRate * 10) / 10,
        avgPredictedKwh: Math.round(avgPredictedKwh),
        avgActualKwh: Math.round(avgActualKwh),
        avgPredictedBill: Math.round(avgPredictedBill),
        avgActualBill: Math.round(avgActualBill),
        avgDeviationPct: Math.round(avgDeviationPct * 10) / 10,
      };
    } catch (error) {
      logger.error('Error fetching power usage billing summary:', error);
      throw error;
    }
  }

  /**
   * Get monthly series data for a site
   */
  async getSiteMonthlyData(siteId: string): Promise<{
    consumptionSeries: MonthlySeriesPoint[];
    billingSeries: MonthlySeriesPoint[];
  }> {
    try {
      const query = `
        SELECT
          p.yearmonth,
          p.predicted_kwh as predictedKwh,
          coalesce(p.actual_kwh, p.predicted_kwh) as actualKwh
        FROM gold.kwh_predictions_v0 p
        WHERE p.site_id = '${siteId}'
        ORDER BY p.yearmonth ASC
        LIMIT 24
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const rawData = await result.json<any[]>();

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

      const consumptionSeries: MonthlySeriesPoint[] = rawData.map((row) => {
        const yearmonthStr = String(row.yearmonth);
        const monthIndex = parseInt(yearmonthStr.substring(4, 6)) - 1;
        return {
          m: months[monthIndex],
          predicted: Math.round(Number(row.predictedKwh) || 0),
          actual: Math.round(Number(row.actualKwh) || 0),
        };
      });

      const billingSeries: MonthlySeriesPoint[] = rawData.map((row) => {
        const yearmonthStr = String(row.yearmonth);
        const monthIndex = parseInt(yearmonthStr.substring(4, 6)) - 1;
        const predictedKwh = Number(row.predictedKwh) || 0;
        const actualKwh = Number(row.actualKwh) || 0;
        return {
          m: months[monthIndex],
          predicted: Math.round(predictedKwh * TARIF_PLN_PER_KWH),
          actual: Math.round(actualKwh * TARIF_PLN_PER_KWH),
        };
      });

      return { consumptionSeries, billingSeries };
    } catch (error) {
      logger.error('Error fetching site monthly data:', error);
      throw error;
    }
  }

  /**
   * Get available periods (yearmonth values)
   */
  async getAvailablePeriods(): Promise<{ yearmonth: number; label: string }[]> {
    try {
      const query = `
        SELECT DISTINCT yearmonth
        FROM gold.kwh_predictions_v0
        ORDER BY yearmonth DESC
        LIMIT 24
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const rawData = await result.json<{ yearmonth: number }[]>();

      const months = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

      return rawData.map((row) => {
        const yearmonthStr = String(row.yearmonth);
        const year = yearmonthStr.substring(0, 4);
        const monthIndex = parseInt(yearmonthStr.substring(4, 6)) - 1;
        return {
          yearmonth: row.yearmonth,
          label: `${months[monthIndex]} ${year}`,
        };
      });
    } catch (error) {
      logger.error('Error fetching available periods:', error);
      throw error;
    }
  }

  /**
   * Get filter options (regions, NOPs, regencies) with cascading mappings
   */
  async getFilterOptions(): Promise<{
    regions: string[];
    nops: string[];
    regencies: string[];
    nopsByRegion: Record<string, string[]>;
    regenciesByNop: Record<string, string[]>;
    powerRanges: string[];
    payloadLevels: string[];
    outlierTypes: string[];
  }> {
    try {
      const query = `
        SELECT DISTINCT
          coalesce(s.provinsi, 'Unknown') as region,
          coalesce(s.nop, 'Unknown') as nop,
          coalesce(s.kabupaten_kota, 'Unknown') as regency
        FROM gold.kwh_predictions_v0 p
        LEFT JOIN gold.site_attributes s ON p.site_id = s.site_id
        WHERE p.yearmonth = (SELECT max(yearmonth) FROM gold.kwh_predictions_v0)
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const rawData = await result.json<{ region: string; nop: string; regency: string }[]>();

      const regions = ['All Region', ...new Set(rawData.map((r) => r.region).filter(Boolean).sort())];
      const nops = ['All NOP', ...new Set(rawData.map((r) => r.nop).filter(Boolean).sort())];
      const regencies = ['All Regency', ...new Set(rawData.map((r) => r.regency).filter(Boolean).sort())];

      // Build nopsByRegion mapping
      const nopsByRegion: Record<string, string[]> = {};
      for (const row of rawData) {
        if (!row.region || !row.nop) continue;
        if (!nopsByRegion[row.region]) {
          nopsByRegion[row.region] = [];
        }
        if (!nopsByRegion[row.region].includes(row.nop)) {
          nopsByRegion[row.region].push(row.nop);
        }
      }
      // Sort NOPs within each region
      for (const region of Object.keys(nopsByRegion)) {
        nopsByRegion[region].sort();
      }

      // Build regenciesByNop mapping
      const regenciesByNop: Record<string, string[]> = {};
      for (const row of rawData) {
        if (!row.nop || !row.regency) continue;
        if (!regenciesByNop[row.nop]) {
          regenciesByNop[row.nop] = [];
        }
        if (!regenciesByNop[row.nop].includes(row.regency)) {
          regenciesByNop[row.nop].push(row.regency);
        }
      }
      // Sort regencies within each NOP
      for (const nop of Object.keys(regenciesByNop)) {
        regenciesByNop[nop].sort();
      }

      return {
        regions,
        nops,
        regencies,
        nopsByRegion,
        regenciesByNop,
        powerRanges: ['All Range', '< 53.000 VA', '>= 53.000 VA'],
        payloadLevels: ['All Payload', 'Low', 'Medium', 'High'],
        outlierTypes: ['All Outlier', 'Valid', 'Over', 'Under'],
      };
    } catch (error) {
      logger.error('Error fetching filter options:', error);
      throw error;
    }
  }

  /**
   * Get model performance summary by cluster
   */
  async getModelPerformanceSummary(): Promise<ClusterSummary[]> {
    try {
      const query = `
        SELECT
          daya_cluster as dayaCluster,
          count() as totalSites,
          avg(test_r2) as avgR2,
          avg(test_rmse) as avgRmse,
          avg(test_mae) as avgMae,
          avg(test_mape) as avgMape
        FROM gold.kwh_model_registry
        GROUP BY daya_cluster
        ORDER BY daya_cluster
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<ClusterSummary[]>();
      return data;
    } catch (error) {
      logger.error('Error fetching model performance summary:', error);
      throw error;
    }
  }

  /**
   * Get latest yearmonth from predictions
   */
  private async getLatestYearmonth(): Promise<number> {
    try {
      const query = `SELECT max(yearmonth) as maxYearmonth FROM gold.kwh_predictions_v0`;
      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });
      const data = await result.json<{ maxYearmonth: number }[]>();
      return data[0]?.maxYearmonth || 202508;
    } catch (error) {
      logger.error('Error fetching latest yearmonth:', error);
      return 202508;
    }
  }

  /**
   * Get cluster averages for a specific yearmonth
   */
  private async getClusterAverages(yearmonth: number): Promise<Map<string, { avgKwh: number; avgBill: number }>> {
    try {
      const query = `
        SELECT
          daya_cluster,
          avg(coalesce(actual_kwh, predicted_kwh)) as avgKwh
        FROM gold.kwh_predictions_v0
        WHERE yearmonth = ${yearmonth}
        GROUP BY daya_cluster
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<{ daya_cluster: string; avgKwh: number }[]>();
      
      const map = new Map<string, { avgKwh: number; avgBill: number }>();
      data.forEach((row) => {
        map.set(row.daya_cluster, {
          avgKwh: Math.round(row.avgKwh),
          avgBill: Math.round(row.avgKwh * TARIF_PLN_PER_KWH),
        });
      });

      return map;
    } catch (error) {
      logger.error('Error fetching cluster averages:', error);
      return new Map();
    }
  }
}

export const powerUsageBillingService = new PowerUsageBillingService();
