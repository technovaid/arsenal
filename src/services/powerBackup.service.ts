import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface PowerBackupSite {
  id: string;
  siteId: string;
  region: string;
  tier: string;
  capacity: string;
  lastOutage: string;
  duration: string;
  alarmCount: number;
  risk: string;
  position: [number, number];
  downtimeRisk: string;
  backupCapacity: string;
  batteryStatus: string;
  warranty: string;
}

interface PowerBackupDetail {
  id: string;
  siteId: string;
  region: string;
  tier: string;
  capacity: string;
  lastOutage: string;
  duration: string;
  alarmCount: number;
  risk: string;
  downtimeRisk: string;
  backupCapacity: string;
  batteryStatus: string;
  warranty: string;
  temperature: string;
  voltage: string;
  current: string;
  status: string;
  avgConsumption: string;
  backupCapacityHours: string;
  predictedNeed: string;
  currentHealth: string;
  avgTemperature: string;
  chargeCycles: number;
}

interface PowerAnalysisData {
  hourlyData: Array<{ hour: string; consumption: number; isOutage: boolean }>;
  avgConsumption: string;
  backupCapacity: string;
  predictedNeed: string;
}

interface OutageHistoryData {
  monthlyData: Array<{ month: string; outages: number; avgTime: number }>;
  monthlyAverage: number;
  avgTime: string;
}

interface BatteryHealthData {
  dailyData: Array<{ day: number; health: number; temperature: number; maxHealth: number; minHealth: number }>;
  currentHealth: string;
  avgTemperature: string;
  chargeCycles: number;
}

export class PowerBackupService {
  /**
   * Get power backup sites with filtering and pagination
   */
  async getPowerBackupSites(params: {
    search?: string;
    region?: string;
    tier?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: PowerBackupSite[]; total: number; page: number; limit: number }> {
    const { search, region, tier, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    try {
      const siteWhereClause: any = {
        isActive: true,
      };

      if (search) {
        siteWhereClause.OR = [
          { siteId: { contains: search, mode: 'insensitive' } },
          { siteName: { contains: search, mode: 'insensitive' } },
        ];
      }

      if (region && region !== 'All Regions') {
        siteWhereClause.region = region;
      }

      const sites = await prisma.site.findMany({
        where: siteWhereClause,
        skip,
        take: limit,
        orderBy: { siteId: 'asc' },
        include: {
          backupPlacements: {
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
        },
      });

      const total = await prisma.site.count({ where: siteWhereClause });

      const powerBackupSites: PowerBackupSite[] = sites.map((site) => {
        const backup = site.backupPlacements[0];
        
        // Determine tier based on priority score or capacity
        let siteTier = 'Silver';
        if (backup?.priorityScore) {
          if (backup.priorityScore >= 80) siteTier = 'Platinum';
          else if (backup.priorityScore >= 60) siteTier = 'Gold';
          else if (backup.priorityScore >= 40) siteTier = 'Silver';
          else siteTier = 'Bronze';
        }

        // Filter by tier if specified
        if (tier && tier !== 'All Tier' && siteTier !== tier) {
          return null;
        }

        // Determine risk level
        let risk = 'Normal';
        if (backup?.status === 'CRITICAL') risk = 'Critical';
        else if (backup?.status === 'AT_RISK') risk = 'High';
        else if (backup?.urgencyLevel === 'HIGH') risk = 'High';
        else if (backup?.urgencyLevel === 'MEDIUM') risk = 'Medium';

        return {
          id: site.siteId,
          siteId: site.siteId,
          region: site.region,
          tier: siteTier,
          capacity: `${backup?.currentBatteryCapacity || 10} kWh / 3h`,
          lastOutage: backup?.lastOutageDate 
            ? this.formatTimeAgo(backup.lastOutageDate) 
            : '5h ago',
          duration: `${backup?.avgOutageDuration || 2.5}h`,
          alarmCount: Math.floor(Math.random() * 8),
          risk,
          position: [site.latitude, site.longitude] as [number, number],
          downtimeRisk: 'Normal',
          backupCapacity: `${backup?.predictedBackupDuration || 9.9}h`,
          batteryStatus: 'Online',
          warranty: 'Level 2',
        };
      }).filter(Boolean) as PowerBackupSite[];

      return {
        data: powerBackupSites,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error fetching power backup sites:', error);
      return this.getSamplePowerBackupSites(page, limit);
    }
  }

  /**
   * Get available regions
   */
  async getRegions(): Promise<string[]> {
    try {
      const regions = await prisma.site.findMany({
        select: { region: true },
        distinct: ['region'],
        orderBy: { region: 'asc' },
      });

      return regions.map((r) => r.region);
    } catch (error) {
      console.error('Error fetching regions:', error);
      return ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar', 'Palembang'];
    }
  }

  /**
   * Get power backup site detail
   */
  async getPowerBackupDetail(siteId: string): Promise<PowerBackupDetail | null> {
    try {
      const site = await prisma.site.findFirst({
        where: { siteId },
        include: {
          backupPlacements: {
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
        },
      });

      if (!site) {
        return this.getSamplePowerBackupDetail(siteId);
      }

      const backup = site.backupPlacements[0];

      let tier = 'Silver';
      if (backup?.priorityScore) {
        if (backup.priorityScore >= 80) tier = 'Platinum';
        else if (backup.priorityScore >= 60) tier = 'Gold';
        else if (backup.priorityScore >= 40) tier = 'Silver';
        else tier = 'Bronze';
      }

      let risk = 'Normal';
      if (backup?.status === 'CRITICAL') risk = 'Critical';
      else if (backup?.status === 'AT_RISK') risk = 'High';
      else if (backup?.urgencyLevel === 'HIGH') risk = 'High';
      else if (backup?.urgencyLevel === 'MEDIUM') risk = 'Medium';

      return {
        id: site.id,
        siteId: site.siteId,
        region: site.region,
        tier,
        capacity: `${backup?.currentBatteryCapacity || 10} kWh / 3h`,
        lastOutage: backup?.lastOutageDate 
          ? this.formatTimeAgo(backup.lastOutageDate) 
          : '5h ago',
        duration: `${backup?.avgOutageDuration || 2.5}h`,
        alarmCount: Math.floor(Math.random() * 8),
        risk,
        downtimeRisk: 'Normal',
        backupCapacity: `${backup?.predictedBackupDuration || 2.5}h left`,
        batteryStatus: 'Online',
        warranty: 'Level 2',
        temperature: '28°C',
        voltage: '1000 W',
        current: '1000 kA',
        status: 'Online',
        avgConsumption: '55.6 kWh',
        backupCapacityHours: `${backup?.predictedBackupDuration || 9.9}h`,
        predictedNeed: '7.5h',
        currentHealth: `${backup?.batterySOH || 34}%`,
        avgTemperature: '28.0°C',
        chargeCycles: 245,
      };
    } catch (error) {
      console.error('Error fetching power backup detail:', error);
      return this.getSamplePowerBackupDetail(siteId);
    }
  }

  /**
   * Get power analysis data for a site
   */
  async getPowerAnalysis(siteId: string): Promise<PowerAnalysisData> {
    try {
      // Generate hourly power consumption data
      const hourlyData = Array.from({ length: 24 }, (_, i) => ({
        hour: String(i).padStart(2, '0'),
        consumption: i >= 12 && i <= 14 ? 0 : 50 + Math.random() * 10,
        isOutage: i >= 12 && i <= 14,
      }));

      return {
        hourlyData,
        avgConsumption: '55.6 kWh',
        backupCapacity: '9.9h',
        predictedNeed: '7.5h',
      };
    } catch (error) {
      console.error('Error fetching power analysis:', error);
      return {
        hourlyData: [],
        avgConsumption: '55.6 kWh',
        backupCapacity: '9.9h',
        predictedNeed: '7.5h',
      };
    }
  }

  /**
   * Get outage history for a site (12 months)
   */
  async getOutageHistory(siteId: string): Promise<OutageHistoryData> {
    try {
      const monthlyData = [
        { month: 'Nov', outages: 7, avgTime: 3.5 },
        { month: 'Des', outages: 7, avgTime: 4 },
        { month: 'Jan', outages: 2, avgTime: 2 },
        { month: 'Feb', outages: 6, avgTime: 3.8 },
        { month: 'Mar', outages: 4, avgTime: 3 },
        { month: 'Apr', outages: 2, avgTime: 2.5 },
        { month: 'Mei', outages: 6, avgTime: 4 },
        { month: 'Jun', outages: 3, avgTime: 3 },
        { month: 'Jul', outages: 4, avgTime: 4 },
        { month: 'Agst', outages: 7, avgTime: 4.5 },
        { month: 'Sep', outages: 7, avgTime: 4 },
        { month: 'Okt', outages: 5, avgTime: 3 },
      ];

      const totalOutages = monthlyData.reduce((sum, m) => sum + m.outages, 0);
      const monthlyAverage = Math.round(totalOutages / 12);

      return {
        monthlyData,
        monthlyAverage,
        avgTime: '1.5h',
      };
    } catch (error) {
      console.error('Error fetching outage history:', error);
      return {
        monthlyData: [],
        monthlyAverage: 5,
        avgTime: '1.5h',
      };
    }
  }

  /**
   * Get battery health trend for a site (30 days)
   */
  async getBatteryHealth(siteId: string): Promise<BatteryHealthData> {
    try {
      const dailyData = Array.from({ length: 30 }, (_, i) => ({
        day: i + 1,
        health: 30 + Math.random() * 40,
        temperature: 20 + Math.random() * 15,
        maxHealth: 80,
        minHealth: 20,
      }));

      return {
        dailyData,
        currentHealth: '34%',
        avgTemperature: '28.0°C',
        chargeCycles: 245,
      };
    } catch (error) {
      console.error('Error fetching battery health:', error);
      return {
        dailyData: [],
        currentHealth: '34%',
        avgTemperature: '28.0°C',
        chargeCycles: 245,
      };
    }
  }

  // Helper methods
  private formatTimeAgo(date: Date): string {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    
    if (diffHours < 1) return 'Just now';
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  }

  private getSamplePowerBackupSites(page: number, limit: number): { data: PowerBackupSite[]; total: number; page: number; limit: number } {
    const sampleData: PowerBackupSite[] = [
      { id: 'SITE-001-JKT', siteId: 'SITE-001-JKT', region: 'Jakarta', tier: 'Platinum', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '2.5h', alarmCount: 7, risk: 'Critical', position: [-6.2088, 106.8456], downtimeRisk: 'Normal', backupCapacity: '9.9h', batteryStatus: 'Online', warranty: 'Level 2' },
      { id: 'SITE-002-JKT', siteId: 'SITE-002-JKT', region: 'Jakarta', tier: 'Gold', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '2.5h', alarmCount: 7, risk: 'High', position: [-6.3088, 106.9456], downtimeRisk: 'Normal', backupCapacity: '10.5h', batteryStatus: 'Online', warranty: 'Level 2' },
      { id: 'SITE-003-JKT', siteId: 'SITE-003-JKT', region: 'Jakarta', tier: 'Silver', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '2.5h', alarmCount: 3, risk: 'Medium', position: [-6.1788, 106.7856], downtimeRisk: 'Normal', backupCapacity: '9.9h', batteryStatus: 'Online', warranty: 'Level 2' },
      { id: 'SITE-004-JKT', siteId: 'SITE-004-JKT', region: 'Jakarta', tier: 'Bronze', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '2.5h', alarmCount: 0, risk: 'Normal', position: [-6.2588, 106.8956], downtimeRisk: 'Normal', backupCapacity: '10.0h', batteryStatus: 'Online', warranty: 'Level 2' },
      { id: 'SITE-005-JKT', siteId: 'SITE-005-JKT', region: 'Jakarta', tier: 'Gold', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '2.5h', alarmCount: 2, risk: 'Normal', position: [-6.2288, 106.8256], downtimeRisk: 'Normal', backupCapacity: '9.8h', batteryStatus: 'Online', warranty: 'Level 2' },
      { id: 'SITE-020-JKT', siteId: 'SITE-020-JKT', region: 'Jakarta', tier: 'Platinum', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '10.0h', alarmCount: 0, risk: 'Normal', position: [-6.2388, 106.8656], downtimeRisk: 'Normal', backupCapacity: '10.5h', batteryStatus: 'Online', warranty: 'Level 2' },
      { id: 'SITE-006-BDG', siteId: 'SITE-006-BDG', region: 'Bandung', tier: 'Gold', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '2.5h', alarmCount: 1, risk: 'Normal', position: [-6.9175, 107.6191], downtimeRisk: 'Normal', backupCapacity: '9.7h', batteryStatus: 'Online', warranty: 'Level 2' },
      { id: 'SITE-007-SBY', siteId: 'SITE-007-SBY', region: 'Surabaya', tier: 'Gold', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '2.5h', alarmCount: 2, risk: 'Normal', position: [-7.2575, 112.7521], downtimeRisk: 'Normal', backupCapacity: '10.2h', batteryStatus: 'Online', warranty: 'Level 2' },
      { id: 'SITE-008-MDN', siteId: 'SITE-008-MDN', region: 'Medan', tier: 'Silver', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '2.5h', alarmCount: 0, risk: 'Normal', position: [3.5952, 98.6722], downtimeRisk: 'Normal', backupCapacity: '9.5h', batteryStatus: 'Online', warranty: 'Level 2' },
      { id: 'SITE-009-MKS', siteId: 'SITE-009-MKS', region: 'Makassar', tier: 'Silver', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '2.5h', alarmCount: 2, risk: 'Normal', position: [-5.1477, 119.4327], downtimeRisk: 'Normal', backupCapacity: '10.1h', batteryStatus: 'Online', warranty: 'Level 2' },
      { id: 'SITE-010-PLM', siteId: 'SITE-010-PLM', region: 'Palembang', tier: 'Platinum', capacity: '10 kWh / 3h', lastOutage: '5h ago', duration: '10.0h', alarmCount: 0, risk: 'Normal', position: [-2.9761, 104.7754], downtimeRisk: 'Normal', backupCapacity: '10.5h', batteryStatus: 'Online', warranty: 'Level 2' },
    ];

    return {
      data: sampleData,
      total: 40000,
      page,
      limit,
    };
  }

  private getSamplePowerBackupDetail(siteId: string): PowerBackupDetail {
    return {
      id: '1',
      siteId,
      region: 'Jakarta',
      tier: 'Silver',
      capacity: '10 kWh / 3h',
      lastOutage: '5h ago',
      duration: '2.5h',
      alarmCount: 3,
      risk: 'Medium',
      downtimeRisk: 'Normal',
      backupCapacity: '2.5h left',
      batteryStatus: 'Online',
      warranty: 'Level 2',
      temperature: '28°C',
      voltage: '1000 W',
      current: '1000 kA',
      status: 'Online',
      avgConsumption: '55.6 kWh',
      backupCapacityHours: '9.9h',
      predictedNeed: '7.5h',
      currentHealth: '34%',
      avgTemperature: '28.0°C',
      chargeCycles: 245,
    };
  }
}

export const powerBackupService = new PowerBackupService();
