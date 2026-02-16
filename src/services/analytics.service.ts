import clickhouseClient from '../config/clickhouse';
import logger from '../utils/logger';

export interface DashboardMetrics {
  totalKwh: number;
  averageKwh: number;
  peakKwh: number;
  averagePowerFactor: number;
  totalSites: number;
  timestamp: string;
}

export interface PowerUsageData {
  yearmonth: string;
  totalKwh: number;
  averageKwhPerSite: number;
  dayaCluster: string;
  activeCells2g: number;
  activeCells4g: number;
  activeCells5g: number;
  totalBandwidth: number;
}

export interface PredictionData {
  yearmonth: string;
  predictedKwh: number;
  actualKwh: number | null;
  confidence: number;
  dayaCluster: string;
  modelVersion: string;
}

export interface ModelPerformanceData {
  modelVersion: string;
  dayaCluster: string;
  testRmse: number;
  testMae: number;
  testR2: number;
  testMape: number;
  trainSamples: number;
  testSamples: number;
}

export interface FeatureImportanceData {
  modelVersion: string;
  dayaCluster: string;
  dayaVa: number;
  activeCells2g: number;
  activeCells4g: number;
  activeCells5g: number;
  bandwidth2g: number;
  bandwidth4g: number;
  bandwidth5g: number;
  totalTraffic: number;
  totalVlrSubs: number;
  totalPayload: number;
}

class AnalyticsService {
  /**
   * Get dashboard metrics (summary statistics) - Power Usage & Billing
   * Data dari kwh_prediction_features (historical actual data)
   */
  async getDashboardMetrics(timeRange: 'today' | 'week' | 'month' = 'month') {
    try {
      const query = `
        SELECT
          sum(total_kwh) as totalKwh,
          avg(total_kwh) as averageKwh,
          max(total_kwh) as peakKwh,
          avg(daya_va) as averagePowerFactor,
          count(DISTINCT site_id) as totalSites,
          toString(max(yearmonth)) as timestamp
        FROM gold.kwh_prediction_features
        WHERE yearmonth >= ${this.getYearmonthByRange(timeRange)}
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<DashboardMetrics[]>();
      return data[0] || null;
    } catch (error) {
      logger.error('Error fetching dashboard metrics:', error);
      throw error;
    }
  }

  /**
   * Get power usage graph data - Historical KWH consumption by yearmonth
   * Data dari kwh_prediction_features (training data: 202412-202508)
   */
  async getPowerGraphData(
    timeRange: 'today' | 'week' | 'month' = 'month',
    interval: 'hour' | 'day' = 'day'
  ) {
    try {
      const query = `
        SELECT
          yearmonth,
          sum(total_kwh) as totalKwh,
          avg(total_kwh) as averageKwhPerSite,
          daya_cluster as dayaCluster,
          sum(active_cells_2g) as activeCells2g,
          sum(active_cells_4g) as activeCells4g,
          sum(active_cells_5g) as activeCells5g,
          avg(total_bandwidth) as totalBandwidth
        FROM gold.kwh_prediction_features
        WHERE yearmonth >= ${this.getYearmonthByRange(timeRange)}
        GROUP BY yearmonth, daya_cluster
        ORDER BY yearmonth ASC
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<PowerUsageData[]>();
      return data;
    } catch (error) {
      logger.error('Error fetching power graph data:', error);
      throw error;
    }
  }

  /**
   * Get power factor graph data - Daya VA trend over time
   * Data dari kwh_prediction_features
   */
  async getPowerFactorGraphData(
    timeRange: 'today' | 'week' | 'month' = 'month',
    interval: 'hour' | 'day' = 'day'
  ) {
    try {
      const query = `
        SELECT
          yearmonth,
          avg(daya_va) as averageDayaVa,
          max(daya_va) as peakDayaVa,
          min(daya_va) as minDayaVa
        FROM gold.kwh_prediction_features
        WHERE yearmonth >= ${this.getYearmonthByRange(timeRange)}
        GROUP BY yearmonth
        ORDER BY yearmonth ASC
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json();
      return data;
    } catch (error) {
      logger.error('Error fetching power factor graph data:', error);
      throw error;
    }
  }

  /**
   * Get predicted KWH usage - ML predictions dari kwh_predictions_v0
   * Data dari kwh_predictions_v0 (hasil Machine Learning)
   */
  async getPredictedPowerUsage(
    days: number = 7,
    dayaCluster?: string
  ) {
    try {
      let whereClause = '';
      if (dayaCluster) {
        whereClause = `AND daya_cluster = '${dayaCluster}'`;
      }

      // Calculate yearmonth for filtering (get predictions from last 6 months onwards)
      const now = new Date();
      const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, 1);
      const minYearmonth = parseInt(`${sixMonthsAgo.getFullYear()}${String(sixMonthsAgo.getMonth() + 1).padStart(2, '0')}`);

      const query = `
        SELECT
          yearmonth,
          predicted_kwh as predictedKwh,
          actual_kwh as actualKwh,
          IF(actual_kwh IS NOT NULL, 
             1 - (ABS(predicted_kwh - actual_kwh) / actual_kwh), 
             0.95) as confidence,
          daya_cluster as dayaCluster,
          model_version as modelVersion
        FROM gold.kwh_predictions_v0
        WHERE yearmonth >= ${minYearmonth}
        ${whereClause}
        ORDER BY yearmonth DESC
        LIMIT 100
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<PredictionData[]>();
      return data;
    } catch (error) {
      logger.error('Error fetching predicted power usage:', error);
      throw error;
    }
  }

  /**
   * Get model performance metrics - Accuracy dan error metrics
   * Data dari kwh_model_registry (model performance)
   */
  async getModelPerformance(dayaCluster?: string) {
    try {
      let whereClause = '';
      if (dayaCluster) {
        whereClause = `WHERE daya_cluster = '${dayaCluster}'`;
      }

      const query = `
        SELECT
          model_version as modelVersion,
          daya_cluster as dayaCluster,
          test_rmse as testRmse,
          test_mae as testMae,
          test_r2 as testR2,
          test_mape as testMape,
          train_samples as trainSamples,
          test_samples as testSamples
        FROM gold.kwh_model_registry
        ${whereClause}
        ORDER BY _created_at DESC
        LIMIT 10
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<ModelPerformanceData[]>();
      return data;
    } catch (error) {
      logger.error('Error fetching model performance:', error);
      throw error;
    }
  }

  /**
   * Get feature importance - SHAP values untuk understand model decisions
   * Data dari kwh_predictions_v0 (SHAP feature importance)
   */
  async getFeatureImportance(dayaCluster?: string) {
    try {
      let whereClause = '';
      if (dayaCluster) {
        whereClause = `WHERE daya_cluster = '${dayaCluster}'`;
      }

      const query = `
        SELECT
          model_version as modelVersion,
          daya_cluster as dayaCluster,
          avg(shap_daya_va) as dayaVa,
          avg(shap_active_cells_2g) as activeCells2g,
          avg(shap_active_cells_4g) as activeCells4g,
          avg(shap_active_cells_5g) as activeCells5g,
          avg(shap_bandwidth_2g) as bandwidth2g,
          avg(shap_bandwidth_4g) as bandwidth4g,
          avg(shap_bandwidth_5g) as bandwidth5g,
          avg(shap_total_traffic_erl) as totalTraffic,
          avg(shap_total_vlr_subs) as totalVlrSubs,
          avg(shap_total_payload_mbyte) as totalPayload
        FROM gold.kwh_predictions_v0
        ${whereClause}
        GROUP BY model_version, daya_cluster
        ORDER BY model_version DESC
        LIMIT 10
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json<FeatureImportanceData[]>();
      return data;
    } catch (error) {
      logger.error('Error fetching feature importance:', error);
      throw error;
    }
  }

  /**
   * Get power usage by site - Top consumers
   */
  async getPowerUsageBySite(limit: number = 20, yearmonth?: number) {
    try {
      let whereClause = '';
      if (yearmonth) {
        whereClause = `WHERE f.yearmonth = ${yearmonth}`;
      } else {
        whereClause = `WHERE f.yearmonth = (SELECT max(yearmonth) FROM gold.kwh_prediction_features)`;
      }

      const query = `
        SELECT
          f.site_id,
          s.site_name,
          s.area,
          s.regional,
          f.total_kwh,
          f.daya_va,
          f.daya_cluster,
          f.total_active_cells,
          f.total_bandwidth
        FROM gold.kwh_prediction_features f
        LEFT JOIN gold.site_attributes s ON f.site_id = s.site_id
        ${whereClause}
        ORDER BY f.total_kwh DESC
        LIMIT ${limit}
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json();
      return data;
    } catch (error) {
      logger.error('Error fetching power usage by site:', error);
      throw error;
    }
  }

  /**
   * Get prediction accuracy - Compare predicted vs actual
   */
  async getPredictionAccuracy(dayaCluster?: string) {
    try {
      let whereClause = 'WHERE actual_kwh IS NOT NULL';
      if (dayaCluster) {
        whereClause += `AND daya_cluster = '${dayaCluster}'`;
      }

      const query = `
        SELECT
          model_version,
          daya_cluster,
          count() as totalPredictions,
          avg(ABS(predicted_kwh - actual_kwh)) as meanAbsoluteError,
          avg(ABS(predicted_kwh - actual_kwh) / actual_kwh * 100) as meanAbsolutePercentageError,
          min(actual_kwh) as minActualKwh,
          max(actual_kwh) as maxActualKwh,
          avg(actual_kwh) as avgActualKwh
        FROM gold.kwh_predictions_v0
        ${whereClause}
        GROUP BY model_version, daya_cluster
        ORDER BY model_version DESC
      `;

      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json();
      return data;
    } catch (error) {
      logger.error('Error fetching prediction accuracy:', error);
      throw error;
    }
  }

  /**
   * Get custom query results (for flexible analytics)
   */
  async executeCustomQuery(query: string) {
    try {
      const result = await clickhouseClient.query({
        query,
        format: 'JSONEachRow',
      });

      const data = await result.json();
      return data;
    } catch (error) {
      logger.error('Error executing custom query:', error);
      throw error;
    }
  }

  /**
   * Helper function to get yearmonth based on time range
   * Returns yearmonth in YYYYMM format
   */
  private getYearmonthByRange(timeRange: string): number {
    const now = new Date();
    const currentYear = now.getFullYear();
    const currentMonth = now.getMonth() + 1;

    switch (timeRange) {
      case 'today':
      case 'week':
        // Return current month
        return parseInt(`${currentYear}${String(currentMonth).padStart(2, '0')}`);
      case 'month':
        // Return last 3 months
        const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 3, 1);
        return parseInt(`${threeMonthsAgo.getFullYear()}${String(threeMonthsAgo.getMonth() + 1).padStart(2, '0')}`);
      default:
        return parseInt(`${currentYear}${String(currentMonth).padStart(2, '0')}`);
    }
  }
}

export const analyticsService = new AnalyticsService();
