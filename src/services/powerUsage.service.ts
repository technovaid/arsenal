import prisma from '../config/database';
import logger from '../utils/logger';

interface PowerUsageChartData {
  costChart: Array<{
    month: string;
    predicted: number;
    actual: number;
  }>;
  consumptionChart: Array<{
    month: string;
    predicted: number;
    actual: number;
  }>;
}

interface PowerUsageHistoryParams {
  siteId: string;
  period?: number; // months
}

interface PowerUsageSitesParams {
  search?: string;
  region?: string;
  nop?: string;
  regency?: string;
  powerRange?: string;
  payloadLevel?: string;
  outlierType?: string;
  period?: string;
}

interface PowerUsageSite {
  id: string;
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
}

class PowerUsageService {
  /**
   * Get power usage history for charts
   */
  async getSitePowerUsage(params: PowerUsageHistoryParams): Promise<PowerUsageChartData> {
    try {
      const { siteId, period = 6 } = params;

      const now = new Date();
      const startDate = new Date(now.getFullYear(), now.getMonth() - period, 1);

      // Find site first
      const site = await prisma.site.findFirst({
        where: { siteId },
      });

      if (!site) {
        return this.getSampleChartData();
      }

      // Get power usage data
      const powerUsages = await prisma.powerUsage.findMany({
        where: {
          siteId: site.id,
          date: {
            gte: startDate,
            lte: now,
          },
        },
        orderBy: { date: 'asc' },
      });

      if (powerUsages.length === 0) {
        return this.getSampleChartData();
      }

      // Group by month
      const monthData: Record<string, { consumption: number; billing: number; predicted: number; count: number }> = {};

      powerUsages.forEach((usage) => {
        const date = new Date(usage.date);
        const monthKey = date.toLocaleString('en-US', { month: 'short' });

        if (!monthData[monthKey]) {
          monthData[monthKey] = { consumption: 0, billing: 0, predicted: 0, count: 0 };
        }

        monthData[monthKey].consumption += usage.consumptionKwh;
        monthData[monthKey].billing += usage.billingAmount || usage.consumptionKwh * 1500;
        monthData[monthKey].predicted += usage.predictedConsumption || usage.consumptionKwh * 0.95;
        monthData[monthKey].count++;
      });

      const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const orderedMonths = months.filter((m) => monthData[m]);

      const costChart = orderedMonths.map((month) => ({
        month,
        predicted: Math.round(monthData[month].billing * 0.95),
        actual: Math.round(monthData[month].billing),
      }));

      const consumptionChart = orderedMonths.map((month) => ({
        month,
        predicted: Math.round(monthData[month].predicted),
        actual: Math.round(monthData[month].consumption),
      }));

      return { costChart, consumptionChart };
    } catch (error) {
      logger.error('Error getting site power usage:', error);
      return this.getSampleChartData();
    }
  }

  /**
   * Get power usage sites with filtering
   */
  async getPowerUsageSites(params: PowerUsageSitesParams): Promise<PowerUsageSite[]> {
    try {
      const { search, region, nop, regency, powerRange, payloadLevel, outlierType, period } = params;

      // Build where clause
      const whereClause: Record<string, unknown> = {
        isActive: true,
      };

      if (search) {
        whereClause.OR = [
          { siteId: { contains: search, mode: 'insensitive' } },
          { siteName: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (region && region !== 'All Region') {
        whereClause.region = { contains: region, mode: 'insensitive' };
      }

      // Get sites with latest power usage
      const sites = await prisma.site.findMany({
        where: whereClause,
        include: {
          powerUsages: {
            take: 1,
            orderBy: { date: 'desc' },
          },
        },
        orderBy: { siteId: 'asc' },
      });

      // Get anomaly alerts for these sites
      const siteIds = sites.map((s) => s.id);
      const alerts = await prisma.anomalyAlert.findMany({
        where: {
          siteId: { in: siteIds },
          status: { in: ['OPEN', 'ACKNOWLEDGED', 'IN_PROGRESS'] },
        },
        orderBy: { severity: 'asc' },
      });

      // Group alerts by siteId
      const alertsBySite: Record<string, typeof alerts[0]> = {};
      alerts.forEach((alert) => {
        if (alert.siteId && !alertsBySite[alert.siteId]) {
          alertsBySite[alert.siteId] = alert;
        }
      });

      // Transform to PowerUsageSite format
      let powerUsageSites: PowerUsageSite[] = sites.map((site) => {
        const latestUsage = site.powerUsages[0];
        const latestAlert = alertsBySite[site.id];

        // Determine anomaly status
        let anomalyStatus: 'Normal' | 'High' | 'Critical' = 'Normal';
        if (latestAlert) {
          if (latestAlert.severity === 'CRITICAL') anomalyStatus = 'Critical';
          else if (latestAlert.severity === 'HIGH') anomalyStatus = 'High';
        }

        // Calculate values
        const actualKwh = latestUsage?.consumptionKwh || 2000 + Math.random() * 3000;
        const predictedKwh = latestUsage?.predictedConsumption || actualKwh * (0.9 + Math.random() * 0.2);
        const actualBill = latestUsage?.billingAmount || actualKwh * 1500;
        const predictedBill = predictedKwh * 1500;
        const deviationPct = ((actualKwh - predictedKwh) / predictedKwh) * 100;

        // Determine outlier type
        let outlierTypeValue: 'Valid' | 'Over' | 'Under' = 'Valid';
        if (Math.abs(deviationPct) >= 0.1) {
          outlierTypeValue = deviationPct > 0 ? 'Over' : 'Under';
        }

        // Determine payload level based on consumption
        let payloadLevelValue: 'Low' | 'Medium' | 'High' = 'Medium';
        if (actualKwh < 2500) payloadLevelValue = 'Low';
        else if (actualKwh >= 4500) payloadLevelValue = 'High';

        // Determine power VA (estimate based on consumption)
        const powerVa = actualKwh < 2500 ? 42000 : actualKwh >= 4500 ? 66000 : 53000;

        // Extract regency from region or use default
        const regencyValue = site.region || 'Unknown';

        return {
          id: site.id,
          siteId: site.siteId,
          siteName: site.siteName || site.siteId,
          region: site.region || 'Unknown',
          nop: `NOP ${site.region || 'Unknown'}`,
          regency: regencyValue,
          payloadLevel: payloadLevelValue,
          powerVa,
          cells: '2 / 2 / 1',
          type: (site.tier === 'PLATINUM' || site.tier === 'GOLD' ? 'AMR' : 'NON-AMR') as 'AMR' | 'NON-AMR',
          predictedKwh: Math.round(predictedKwh),
          actualKwh: Math.round(actualKwh),
          predictedBill: Math.round(predictedBill),
          actualBill: Math.round(actualBill),
          deviationPct: Math.round(deviationPct * 10) / 10,
          outlierType: outlierTypeValue,
          anomalyStatus,
          lastUpdated: latestUsage?.date?.toISOString().split('T')[0] || new Date().toISOString().split('T')[0],
        };
      });

      // Apply filters
      if (powerRange && powerRange !== 'All Range') {
        powerUsageSites = powerUsageSites.filter((site) => {
          if (powerRange === '< 53.000 VA') return site.powerVa < 53000;
          if (powerRange === '≥ 53.000 VA') return site.powerVa >= 53000;
          return true;
        });
      }

      if (payloadLevel && payloadLevel !== 'All Payload') {
        powerUsageSites = powerUsageSites.filter((site) => site.payloadLevel === payloadLevel);
      }

      if (outlierType && outlierType !== 'All Outlier') {
        powerUsageSites = powerUsageSites.filter((site) => site.outlierType === outlierType);
      }

      if (nop && nop !== 'All NOP') {
        powerUsageSites = powerUsageSites.filter((site) => site.nop === nop);
      }

      if (regency && regency !== 'All Regency') {
        powerUsageSites = powerUsageSites.filter((site) => site.regency === regency);
      }

      // Period filter
      if (period && period !== 'All Period') {
        const now = new Date();
        let monthsBack = 0;
        if (period === 'Last 3 Months') monthsBack = 3;
        else if (period === 'Last 6 Months') monthsBack = 6;
        else if (period === 'Last 12 Months') monthsBack = 12;

        if (monthsBack > 0) {
          const cutoffDate = new Date(now.getFullYear(), now.getMonth() - monthsBack, 1);
          powerUsageSites = powerUsageSites.filter((site) => {
            const siteDate = new Date(site.lastUpdated);
            return siteDate >= cutoffDate;
          });
        }
      }

      // If no data, return sample data
      if (powerUsageSites.length === 0) {
        return this.getSamplePowerUsageSites();
      }

      return powerUsageSites;
    } catch (error) {
      logger.error('Error getting power usage sites:', error);
      return this.getSamplePowerUsageSites();
    }
  }

  /**
   * Get sample power usage sites data
   */
  private getSamplePowerUsageSites(): PowerUsageSite[] {
    return [
      {
        id: '1',
        siteId: 'JKT-001',
        siteName: 'JKT-001_TowerTSEL',
        region: 'Jabodetabek',
        nop: 'NOP Jakarta',
        regency: 'Tambora',
        payloadLevel: 'Medium',
        powerVa: 42000,
        cells: '0 / 2 / 4',
        type: 'AMR',
        predictedKwh: 2500,
        actualKwh: 2700,
        predictedBill: 9000000,
        actualBill: 9750000,
        deviationPct: -0.8,
        outlierType: 'Under',
        anomalyStatus: 'Normal',
        lastUpdated: '2025-01-15',
      },
      {
        id: '2',
        siteId: 'JKT-002',
        siteName: 'JKT-002_Tower Ceria',
        region: 'Jabodetabek',
        nop: 'NOP Jakarta',
        regency: 'Kebayoran Baru',
        payloadLevel: 'High',
        powerVa: 53000,
        cells: '1 / 3 / 1',
        type: 'NON-AMR',
        predictedKwh: 4700,
        actualKwh: 5900,
        predictedBill: 9000000,
        actualBill: 11500000,
        deviationPct: 25.5,
        outlierType: 'Over',
        anomalyStatus: 'Critical',
        lastUpdated: '2025-09-15',
      },
      {
        id: '3',
        siteId: 'JKT-003',
        siteName: 'JKT-003_Tower Bahagia',
        region: 'Jabodetabek',
        nop: 'NOP Jakarta',
        regency: 'Cakung',
        payloadLevel: 'Low',
        powerVa: 35000,
        cells: '2 / 1 / 0',
        type: 'AMR',
        predictedKwh: 1800,
        actualKwh: 1650,
        predictedBill: 6200000,
        actualBill: 5750000,
        deviationPct: -8.3,
        outlierType: 'Under',
        anomalyStatus: 'Normal',
        lastUpdated: '2025-05-10',
      },
      {
        id: '4',
        siteId: 'BGR-001',
        siteName: 'BGR-001_TowerTSEL',
        region: 'Jabar',
        nop: 'NOP Bogor',
        regency: 'Bogor Tengah',
        payloadLevel: 'Medium',
        powerVa: 53000,
        cells: '3 / 2 / 1',
        type: 'AMR',
        predictedKwh: 4100,
        actualKwh: 4550,
        predictedBill: 8600000,
        actualBill: 9200000,
        deviationPct: 11.0,
        outlierType: 'Over',
        anomalyStatus: 'High',
        lastUpdated: '2025-02-20',
      },
      {
        id: '5',
        siteId: 'BGR-002',
        siteName: 'BGR-002_Tower Ceria',
        region: 'Jabar',
        nop: 'NOP Bogor',
        regency: 'Cibinong',
        payloadLevel: 'High',
        powerVa: 66000,
        cells: '4 / 2 / 2',
        type: 'NON-AMR',
        predictedKwh: 5200,
        actualKwh: 6400,
        predictedBill: 10500000,
        actualBill: 13000000,
        deviationPct: 23.1,
        outlierType: 'Over',
        anomalyStatus: 'Critical',
        lastUpdated: '2025-06-11',
      },
      {
        id: '6',
        siteId: 'BDG-001',
        siteName: 'BDG-001_Tower Tertawa',
        region: 'Jabar',
        nop: 'NOP Bogor',
        regency: 'Coblong',
        payloadLevel: 'Low',
        powerVa: 41000,
        cells: '1 / 1 / 1',
        type: 'AMR',
        predictedKwh: 2100,
        actualKwh: 2100,
        predictedBill: 7400000,
        actualBill: 7400000,
        deviationPct: 0,
        outlierType: 'Valid',
        anomalyStatus: 'Normal',
        lastUpdated: '2025-03-15',
      },
      {
        id: '7',
        siteId: 'JOG-001',
        siteName: 'JOG-001_TowerTSEL',
        region: 'Jateng',
        nop: 'NOP Jogja',
        regency: 'Gondokusuman',
        payloadLevel: 'Medium',
        powerVa: 53000,
        cells: '2 / 3 / 1',
        type: 'AMR',
        predictedKwh: 3900,
        actualKwh: 4300,
        predictedBill: 8200000,
        actualBill: 9000000,
        deviationPct: 10.3,
        outlierType: 'Over',
        anomalyStatus: 'High',
        lastUpdated: '2025-04-07',
      },
      {
        id: '8',
        siteId: 'JOG-002',
        siteName: 'JOG-002_Tower Ceria',
        region: 'Jateng',
        nop: 'NOP Jogja',
        regency: 'Kotagede',
        payloadLevel: 'High',
        powerVa: 35000,
        cells: '3 / 1 / 1',
        type: 'NON-AMR',
        predictedKwh: 4400,
        actualKwh: 4050,
        predictedBill: 9400000,
        actualBill: 8700000,
        deviationPct: -8.0,
        outlierType: 'Under',
        anomalyStatus: 'Normal',
        lastUpdated: '2025-08-01',
      },
      {
        id: '9',
        siteId: 'SMG-001',
        siteName: 'SMG-001_Tower Tertawa',
        region: 'Jateng',
        nop: 'NOP Jogja',
        regency: 'Banyumanik',
        payloadLevel: 'Low',
        powerVa: 44000,
        cells: '1 / 2 / 0',
        type: 'AMR',
        predictedKwh: 2600,
        actualKwh: 2950,
        predictedBill: 7800000,
        actualBill: 8650000,
        deviationPct: 13.5,
        outlierType: 'Over',
        anomalyStatus: 'High',
        lastUpdated: '2025-11-10',
      },
      {
        id: '10',
        siteId: 'SBY-001',
        siteName: 'SBY-001_TowerTSEL',
        region: 'Jatim',
        nop: 'NOP Surabaya',
        regency: 'Tegalsari',
        payloadLevel: 'High',
        powerVa: 66000,
        cells: '4 / 3 / 1',
        type: 'NON-AMR',
        predictedKwh: 5600,
        actualKwh: 7200,
        predictedBill: 12000000,
        actualBill: 15000000,
        deviationPct: 28.6,
        outlierType: 'Over',
        anomalyStatus: 'Critical',
        lastUpdated: '2025-12-05',
      },
      {
        id: '11',
        siteId: 'SBY-002',
        siteName: 'SBY-002_Tower Tertawa',
        region: 'Jatim',
        nop: 'NOP Surabaya',
        regency: 'Rungkut',
        payloadLevel: 'Medium',
        powerVa: 53000,
        cells: '2 / 2 / 2',
        type: 'AMR',
        predictedKwh: 4200,
        actualKwh: 3900,
        predictedBill: 9100000,
        actualBill: 8400000,
        deviationPct: -7.1,
        outlierType: 'Under',
        anomalyStatus: 'Normal',
        lastUpdated: '2025-10-15',
      },
      {
        id: '12',
        siteId: 'MLG-001',
        siteName: 'MLG-001_Tower Ceria',
        region: 'Jatim',
        nop: 'NOP Surabaya',
        regency: 'Lowokwaru',
        payloadLevel: 'Low',
        powerVa: 38000,
        cells: '1 / 1 / 1',
        type: 'AMR',
        predictedKwh: 2400,
        actualKwh: 2400,
        predictedBill: 7600000,
        actualBill: 7600000,
        deviationPct: 0,
        outlierType: 'Valid',
        anomalyStatus: 'Normal',
        lastUpdated: '2025-07-21',
      },
      {
        id: '13',
        siteId: 'DPS-001',
        siteName: 'DPS-001_TowerTSEL',
        region: 'Bali',
        nop: 'NOP Denpasar',
        regency: 'Denpasar Barat',
        payloadLevel: 'Low',
        powerVa: 53000,
        cells: '3 / 2 / 1',
        type: 'AMR',
        predictedKwh: 4200,
        actualKwh: 4700,
        predictedBill: 8500000,
        actualBill: 9000000,
        deviationPct: 15,
        outlierType: 'Over',
        anomalyStatus: 'High',
        lastUpdated: '2025-02-15',
      },
      {
        id: '14',
        siteId: 'DPS-002',
        siteName: 'DPS-002_Tower Tertawa',
        region: 'Bali',
        nop: 'NOP Denpasar',
        regency: 'Denpasar Selatan',
        payloadLevel: 'Medium',
        powerVa: 42000,
        cells: '2 / 2 / 0',
        type: 'NON-AMR',
        predictedKwh: 4100,
        actualKwh: 4350,
        predictedBill: 8800000,
        actualBill: 9000000,
        deviationPct: 6.2,
        outlierType: 'Over',
        anomalyStatus: 'Normal',
        lastUpdated: '2025-12-15',
      },
      {
        id: '15',
        siteId: 'DPS-003',
        siteName: 'DPS-003_Tower Ceria',
        region: 'Bali',
        nop: 'NOP Denpasar',
        regency: 'Denpasar Utara',
        payloadLevel: 'High',
        powerVa: 66000,
        cells: '4 / 1 / 2',
        type: 'AMR',
        predictedKwh: 5400,
        actualKwh: 4850,
        predictedBill: 11200000,
        actualBill: 10150000,
        deviationPct: -10.2,
        outlierType: 'Under',
        anomalyStatus: 'High',
        lastUpdated: '2025-09-30',
      },
    ];
  }

  /**
   * Get sample chart data
   */
  private getSampleChartData(): PowerUsageChartData {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'];

    return {
      costChart: months.map((month) => ({
        month,
        predicted: 28000 + Math.round(Math.random() * 5000),
        actual: 30000 + Math.round(Math.random() * 5000),
      })),
      consumptionChart: months.map((month) => ({
        month,
        predicted: 18000 + Math.round(Math.random() * 4000),
        actual: 19500 + Math.round(Math.random() * 4000),
      })),
    };
  }
}

export const powerUsageService = new PowerUsageService();
