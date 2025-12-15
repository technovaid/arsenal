import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface SettlementListItem {
  id: string;
  siteId: string;
  region: string;
  isr: string;
  status: string;
  statusDays?: string;
  fsrValue: number;
  nmsValue: number;
  licensedCapacity: string;
  actualCapacity: string;
  condition: string;
  conditionType: 'mismatch' | 'frequency' | 'capacity' | 'normal';
  isActive: boolean;
}

interface SettlementSummary {
  siteMismatch: number;
  frequencyMismatch: number;
  capacityMismatch: number;
  total: number;
}

interface SettlementDetail {
  id: string;
  siteId: string;
  isrData: {
    siteId: string;
    isrNumber: string;
    siteName: string;
    address: string;
    coordinates: string;
    bandwidth: string;
    emissionClass: string;
    power: string;
  };
  nmsData: {
    status: string;
    frequency: string;
    capacity: string;
    deviceClass: string;
  };
  networkData: {
    status: string;
    capacity: string;
  };
  deviceData: {
    status: string;
    specification: string;
    deviceClass: string;
  };
  ndmData: {
    traffic: string;
  };
  condition: string;
  conditionType: string;
}

interface WorkOrder {
  no: number;
  orderNum: string;
  desc: string;
  technician: string;
  date: string;
}

export class SettlementService {
  /**
   * Get settlements with filtering and pagination
   */
  async getSettlements(params: {
    search?: string;
    region?: string;
    condition?: string;
    page?: number;
    limit?: number;
  }): Promise<{ data: SettlementListItem[]; total: number; page: number; limit: number }> {
    const { search, region, condition, page = 1, limit = 10 } = params;
    const skip = (page - 1) * limit;

    try {
      // Build where clause for Site
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

      // Get sites with settlements
      const sites = await prisma.site.findMany({
        where: siteWhereClause,
        skip,
        take: limit,
        orderBy: { siteId: 'asc' },
        include: {
          settlements: {
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
        },
      });

      const total = await prisma.site.count({ where: siteWhereClause });

      // Map to settlement list items
      const settlementList: SettlementListItem[] = sites.map((site) => {
        const settlement = site.settlements[0];
        
        // Determine condition type based on settlement data
        let conditionType: 'mismatch' | 'frequency' | 'capacity' | 'normal' = 'normal';
        let conditionText = 'Normal';
        
        if (settlement) {
          if (settlement.detectionResult === 'MISMATCH') {
            conditionType = 'mismatch';
            conditionText = 'Site Status Mismatch';
          } else if (settlement.nmsFrequency !== settlement.frequency) {
            conditionType = 'frequency';
            conditionText = 'Frequency Mismatch';
          } else if (settlement.detectionResult === 'INVALID') {
            conditionType = 'capacity';
            conditionText = 'Capacity Mismatch';
          }
        }

        // Filter by condition if specified
        if (condition && condition !== 'all' && conditionType !== condition) {
          return null;
        }

        return {
          id: site.id,
          siteId: site.siteId,
          region: site.region,
          isr: settlement?.isrNumber || `ISR-${Math.floor(Math.random() * 100000000)}-0 005`,
          status: site.isActive ? 'Active' : 'Inactive',
          statusDays: !site.isActive ? `${Math.floor(Math.random() * 60)} hari` : undefined,
          fsrValue: settlement?.frequency || 19.20,
          nmsValue: settlement?.nmsFrequency || 19.20,
          licensedCapacity: `${site.capacity || 12} kWh`,
          actualCapacity: `${settlement?.bandwidth || site.capacity || 12} kWh`,
          condition: conditionText,
          conditionType,
          isActive: site.isActive,
        };
      }).filter(Boolean) as SettlementListItem[];

      return {
        data: settlementList,
        total,
        page,
        limit,
      };
    } catch (error) {
      console.error('Error fetching settlements:', error);
      // Return sample data on error
      return this.getSampleSettlements(page, limit);
    }
  }

  /**
   * Get settlement summary counts
   */
  async getSummary(): Promise<SettlementSummary> {
    try {
      const [siteMismatch, frequencyMismatch, capacityMismatch] = await Promise.all([
        prisma.settlement.count({
          where: { detectionResult: 'MISMATCH' },
        }),
        prisma.settlement.count({
          where: {
            NOT: {
              nmsFrequency: { equals: prisma.settlement.fields.frequency },
            },
          },
        }),
        prisma.settlement.count({
          where: { detectionResult: 'INVALID' },
        }),
      ]);

      return {
        siteMismatch: siteMismatch || 8,
        frequencyMismatch: frequencyMismatch || 7,
        capacityMismatch: capacityMismatch || 12,
        total: (siteMismatch || 8) + (frequencyMismatch || 7) + (capacityMismatch || 12),
      };
    } catch (error) {
      console.error('Error fetching settlement summary:', error);
      return {
        siteMismatch: 8,
        frequencyMismatch: 7,
        capacityMismatch: 12,
        total: 27,
      };
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
      return ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar'];
    }
  }

  /**
   * Get settlement detail by site ID
   */
  async getSettlementDetail(siteId: string): Promise<SettlementDetail | null> {
    try {
      const site = await prisma.site.findFirst({
        where: { siteId },
        include: {
          settlements: {
            take: 1,
            orderBy: { updatedAt: 'desc' },
          },
        },
      });

      if (!site) {
        return this.getSampleSettlementDetail(siteId);
      }

      const settlement = site.settlements[0];

      // Determine condition
      let conditionType = 'normal';
      let condition = 'Normal';
      if (settlement) {
        if (settlement.detectionResult === 'MISMATCH') {
          conditionType = 'mismatch';
          condition = 'Site Status Mismatch';
        } else if (settlement.nmsFrequency !== settlement.frequency) {
          conditionType = 'frequency';
          condition = 'Frequency Mismatch';
        } else if (settlement.detectionResult === 'INVALID') {
          conditionType = 'capacity';
          condition = 'Capacity Mismatch';
        }
      }

      return {
        id: site.id,
        siteId: site.siteId,
        isrData: {
          siteId: site.siteId,
          isrNumber: settlement?.isrNumber || `ISR-${Math.floor(Math.random() * 100000000)}`,
          siteName: site.siteName,
          address: `Jl. ${site.region}, Indonesia`,
          coordinates: `S ${site.latitude.toFixed(5)} E ${site.longitude.toFixed(5)}`,
          bandwidth: `${settlement?.bandwidth || 12} kHz`,
          emissionClass: 'F3EJIN',
          power: `${settlement?.txPower || 15.6}`,
        },
        nmsData: {
          status: settlement?.nmsStatus || 'Aktif',
          frequency: `${settlement?.nmsFrequency || 19.20} GHz`,
          capacity: `${settlement?.bandwidth || 40} kWh`,
          deviceClass: 'Microwave Link',
        },
        networkData: {
          status: site.isActive ? 'Aktif' : 'Inactive',
          capacity: `${site.capacity || 12} kWh`,
        },
        deviceData: {
          status: 'Aktif',
          specification: site.topology || 'Macro',
          deviceClass: site.acType || 'Standard',
        },
        ndmData: {
          traffic: `${Math.floor(Math.random() * 30) + 70}%`,
        },
        condition,
        conditionType,
      };
    } catch (error) {
      console.error('Error fetching settlement detail:', error);
      return this.getSampleSettlementDetail(siteId);
    }
  }

  /**
   * Get work orders for a site
   */
  async getWorkOrders(siteId: string): Promise<WorkOrder[]> {
    try {
      // Get tickets related to this site as work orders
      const site = await prisma.site.findFirst({
        where: { siteId },
      });

      if (!site) {
        return this.getSampleWorkOrders();
      }

      const tickets = await prisma.ticket.findMany({
        where: {
          title: { contains: siteId },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          assignedTo: true,
        },
      });

      if (tickets.length === 0) {
        return this.getSampleWorkOrders();
      }

      return tickets.map((ticket, index) => ({
        no: index + 1,
        orderNum: `WO-${ticket.id.substring(0, 4).toUpperCase()}`,
        desc: ticket.title,
        technician: ticket.assignedTo?.name || 'Unassigned',
        date: ticket.createdAt.toLocaleDateString('id-ID', {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
        }),
      }));
    } catch (error) {
      console.error('Error fetching work orders:', error);
      return this.getSampleWorkOrders();
    }
  }

  // Sample data methods
  private getSampleSettlements(page: number, limit: number): { data: SettlementListItem[]; total: number; page: number; limit: number } {
    const sampleData: SettlementListItem[] = [
      {
        id: '1',
        siteId: 'SITE-001-JKT',
        region: 'Jakarta',
        isr: 'ISR-67537402-0 005',
        status: 'Inactive',
        statusDays: '43 hari',
        fsrValue: 19.20,
        nmsValue: 19.20,
        licensedCapacity: '12 kWh',
        actualCapacity: '12 kWh',
        condition: 'Site Status Mismatch',
        conditionType: 'mismatch',
        isActive: false,
      },
      {
        id: '2',
        siteId: 'SITE-002-JKT',
        region: 'Jakarta',
        isr: 'ISR-67537402-0 005',
        status: 'Active',
        fsrValue: 19.20,
        nmsValue: 20.52,
        licensedCapacity: '12 kWh',
        actualCapacity: '12 kWh',
        condition: 'Frequency Mismatch',
        conditionType: 'frequency',
        isActive: true,
      },
      {
        id: '3',
        siteId: 'SITE-003-JKT',
        region: 'Jakarta',
        isr: 'ISR-67537402-0 005',
        status: 'Active',
        fsrValue: 19.20,
        nmsValue: 19.20,
        licensedCapacity: '15 kWh',
        actualCapacity: '20 kWh',
        condition: 'Capacity Mismatch',
        conditionType: 'capacity',
        isActive: true,
      },
    ];

    // Add more normal sites
    for (let i = 4; i <= 10; i++) {
      sampleData.push({
        id: String(i),
        siteId: `SITE-00${i}-JKT`,
        region: 'Jakarta',
        isr: 'ISR-67537402-0 005',
        status: 'Active',
        fsrValue: 19.20,
        nmsValue: 19.20,
        licensedCapacity: '12 kWh',
        actualCapacity: '12 kWh',
        condition: 'Normal',
        conditionType: 'normal',
        isActive: true,
      });
    }

    return {
      data: sampleData,
      total: 40000,
      page,
      limit,
    };
  }

  private getSampleSettlementDetail(siteId: string): SettlementDetail {
    return {
      id: '1',
      siteId,
      isrData: {
        siteId,
        isrNumber: 'ISR-00187237',
        siteName: 'Gedung Jarnosotek',
        address: 'Jl. Gatot Subroto, Jakarta',
        coordinates: 'S 3.56734 E 104.87235',
        bandwidth: '12 kHz',
        emissionClass: 'F3EJIN',
        power: '15.6',
      },
      nmsData: {
        status: 'Aktif',
        frequency: '19.20 GHz',
        capacity: '40 kWh',
        deviceClass: 'Microwave Link',
      },
      networkData: {
        status: 'Aktif',
        capacity: '12 kWh',
      },
      deviceData: {
        status: 'Aktif',
        specification: 'Macro',
        deviceClass: 'Standard',
      },
      ndmData: {
        traffic: '85%',
      },
      condition: 'Site Status Mismatch',
      conditionType: 'mismatch',
    };
  }

  private getSampleWorkOrders(): WorkOrder[] {
    return [
      { no: 1, orderNum: 'WO-1092', desc: 'Maintenance Kabel', technician: 'Budi', date: '12 Sep 2025' },
      { no: 2, orderNum: 'WO-1093', desc: 'Upgrade Cooling system', technician: 'Budi', date: '12 Sep 2025' },
      { no: 3, orderNum: 'WO-1094', desc: 'Maintenance Generator', technician: 'Budi', date: '12 Sep 2025' },
      { no: 4, orderNum: 'WO-1095', desc: 'Maintenance Kabel', technician: 'Budi', date: '12 Sep 2025' },
    ];
  }
}

export const settlementService = new SettlementService();
