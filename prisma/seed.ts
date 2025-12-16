import { PrismaClient, UserRole, SiteTier, AlertType, AlertSeverity, AlertStatus, TicketPriority, TicketStatus, SLAStatus, NotificationType, NotificationChannel, NotificationStatus } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// Helper functions
function randomInRange(min: number, max: number): number {
  return Math.random() * (max - min) + min;
}

function randomInt(min: number, max: number): number {
  return Math.floor(randomInRange(min, max + 1));
}

function randomPastDate(daysAgo: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - Math.floor(Math.random() * daysAgo));
  return date;
}

function randomPick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function main() {
  console.log('🌱 Starting database seeding...');

  // ============================================
  // USERS
  // ============================================
  console.log('\n📦 Seeding Users...');
  
  const adminPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@arsenal.com' },
    update: {},
    create: {
      email: 'admin@arsenal.com',
      name: 'Admin User',
      password: adminPassword,
      role: UserRole.ADMIN,
      isActive: true,
    },
  });
  console.log('✅ Admin user created:', admin.email);

  const managerPassword = await bcrypt.hash('manager123', 10);
  const manager = await prisma.user.upsert({
    where: { email: 'manager@arsenal.com' },
    update: {},
    create: {
      email: 'manager@arsenal.com',
      name: 'Manager User',
      password: managerPassword,
      role: UserRole.MANAGER,
      isActive: true,
    },
  });
  console.log('✅ Manager user created:', manager.email);

  const analystPassword = await bcrypt.hash('analyst123', 10);
  const analyst = await prisma.user.upsert({
    where: { email: 'analyst@arsenal.com' },
    update: {},
    create: {
      email: 'analyst@arsenal.com',
      name: 'Analyst User',
      password: analystPassword,
      role: UserRole.ANALYST,
      isActive: true,
    },
  });
  console.log('✅ Analyst user created:', analyst.email);

  const opsPassword = await bcrypt.hash('ops123', 10);
  const ops = await prisma.user.upsert({
    where: { email: 'ops@arsenal.com' },
    update: {},
    create: {
      email: 'ops@arsenal.com',
      name: 'Operations User',
      password: opsPassword,
      role: UserRole.OPS,
      isActive: true,
    },
  });
  console.log('✅ Ops user created:', ops.email);

  // Technicians
  const technicianNames = ['Budi Santoso', 'Andi Wijaya', 'Dewi Lestari', 'Rudi Hartono', 'Siti Rahayu'];
  const technicians: any[] = [];
  for (const name of technicianNames) {
    const email = name.toLowerCase().replace(' ', '.') + '@arsenal.com';
    const password = await bcrypt.hash('tech123', 10);
    const tech = await prisma.user.upsert({
      where: { email },
      update: {},
      create: { email, name, password, role: UserRole.OPS, isActive: true },
    });
    technicians.push(tech);
    console.log('✅ Technician created:', tech.email);
  }

  // ============================================
  // SITES
  // ============================================
  console.log('\n📦 Seeding Sites...');

  const regions = ['Jakarta', 'Bandung', 'Surabaya', 'Medan', 'Makassar', 'Palembang', 'Semarang', 'Yogyakarta'];
  const regionCoords: Record<string, { lat: number; lng: number }> = {
    'Jakarta': { lat: -6.2088, lng: 106.8456 },
    'Bandung': { lat: -6.9175, lng: 107.6191 },
    'Surabaya': { lat: -7.2575, lng: 112.7521 },
    'Medan': { lat: 3.5952, lng: 98.6722 },
    'Makassar': { lat: -5.1477, lng: 119.4327 },
    'Palembang': { lat: -2.9761, lng: 104.7754 },
    'Semarang': { lat: -6.9666, lng: 110.4196 },
    'Yogyakarta': { lat: -7.7956, lng: 110.3695 },
  };

  const tiers = [SiteTier.PLATINUM, SiteTier.GOLD, SiteTier.SILVER, SiteTier.BRONZE];
  const topologies = ['Macro', 'Micro', 'IBS', 'Small Cell'];
  const locationTypes = ['Urban', 'Suburban', 'Rural'];
  const pricingTypes = ['B3', 'I3', 'R1', 'R2'];

  const createdSites: any[] = [];

  for (const region of regions) {
    const coords = regionCoords[region];
    const sitesPerRegion = randomInt(8, 15);

    for (let i = 1; i <= sitesPerRegion; i++) {
      const siteId = `${region.substring(0, 3).toUpperCase()}-${String(i).padStart(3, '0')}`;
      const tier = randomPick(tiers);
      
      const site = await prisma.site.upsert({
        where: { siteId },
        update: {},
        create: {
          siteId,
          siteName: `${region} BTS ${i}`,
          region,
          latitude: coords.lat + randomInRange(-0.1, 0.1),
          longitude: coords.lng + randomInRange(-0.1, 0.1),
          capacity: randomInRange(1000, 10000),
          tier,
          topology: randomPick(topologies),
          rectifierCapacity: randomInRange(50, 300),
          acUnits: randomInt(1, 5),
          acType: randomPick(['Split', 'Precision', 'Central']),
          coolingSystem: randomPick(['Air Cooled', 'Water Cooled', 'Free Cooling']),
          hasGenset: Math.random() > 0.3,
          climateZone: 'Tropical',
          locationType: randomPick(locationTypes),
          altitude: randomInRange(0, 500),
          pricingType: randomPick(pricingTypes),
          isActive: Math.random() > 0.05,
        },
      });
      createdSites.push(site);
    }
    console.log(`✅ ${sitesPerRegion} sites created for ${region}`);
  }

  // ============================================
  // POWER USAGE
  // ============================================
  console.log('\n📦 Seeding Power Usage...');

  const powerUsages: any[] = [];
  for (const site of createdSites.slice(0, 40)) {
    for (let month = 0; month < 12; month++) {
      const date = new Date();
      date.setMonth(date.getMonth() - month);
      date.setDate(1);

      const baseConsumption = randomInRange(3000, 8000);
      const consumption = baseConsumption + randomInRange(-500, 500);
      const predictedConsumption = baseConsumption;
      const deviation = consumption - predictedConsumption;
      const deviationPercentage = (deviation / predictedConsumption) * 100;

      const powerUsage = await prisma.powerUsage.create({
        data: {
          siteId: site.id,
          date,
          consumptionKwh: consumption,
          billingAmount: consumption * randomInRange(1200, 1500),
          predictedConsumption,
          predictedBilling: predictedConsumption * 1350,
          deviation,
          deviationPercentage,
          amrReading: consumption + randomInRange(-10, 10),
          amrTimestamp: date,
          trafficVolume: randomInRange(1000, 5000),
          payload: randomInRange(100, 500),
        },
      });
      powerUsages.push(powerUsage);
    }
  }
  console.log(`✅ ${powerUsages.length} power usage records created`);

  // ============================================
  // CLUSTERING RESULTS
  // ============================================
  console.log('\n📦 Seeding Clustering Results...');

  const clusterNames = ['High Efficiency', 'Medium Efficiency', 'Low Efficiency', 'Anomaly Cluster'];
  let clusterCount = 0;
  for (const usage of powerUsages.slice(0, 150)) {
    const clusterId = randomInt(0, 3);
    await prisma.clusteringResult.create({
      data: {
        usageId: usage.id,
        clusterId,
        clusterName: clusterNames[clusterId],
        efficiencyScore: randomInRange(0.5, 1.0),
        recommendation: clusterId === 3 ? 'Investigate anomaly' : clusterId === 2 ? 'Optimize cooling' : null,
        modelVersion: 'v1.0.0',
      },
    });
    clusterCount++;
  }
  console.log(`✅ ${clusterCount} clustering results created`);

  // ============================================
  // SETTLEMENTS
  // ============================================
  console.log('\n📦 Seeding Settlements...');

  const detectionResults = ['VALID', 'INVALID', 'MISMATCH', 'EXPIRED'];
  const settlementStatuses = ['Active', 'Pending', 'Expired', 'Suspended'];
  let settlementCount = 0;

  for (const site of createdSites) {
    const detectionResult = randomPick(detectionResults);
    const isrFrequency = randomInRange(5000, 6000);
    const nmsFrequency = detectionResult === 'MISMATCH' ? isrFrequency + randomInRange(50, 200) : isrFrequency + randomInRange(-10, 10);

    await prisma.settlement.create({
      data: {
        siteId: site.id,
        isrNumber: `ISR-${randomInt(10000000, 99999999)}-${String(randomInt(0, 999)).padStart(4, '0')}`,
        isrStatus: randomPick(['Active', 'Pending', 'Expired']),
        isrExpiryDate: new Date(Date.now() + randomInRange(-365, 365) * 24 * 60 * 60 * 1000),
        frequency: isrFrequency,
        txPower: randomInRange(20, 40),
        bandwidth: randomPick([10, 20, 40, 80]),
        distance: randomInRange(1, 50),
        rentFee: randomInRange(1000000, 10000000),
        settlementStatus: randomPick(settlementStatuses),
        detectionResult,
        detectionReason: detectionResult === 'VALID' ? null : `${detectionResult} - Requires verification`,
        potentialSavings: detectionResult !== 'VALID' ? randomInRange(1000000, 5000000) : 0,
        nmsStatus: randomPick(['Online', 'Offline', 'Degraded']),
        nmsTxPower: randomInRange(18, 42),
        nmsFrequency,
        nmsThroughput: randomInRange(100, 1000),
      },
    });
    settlementCount++;
  }
  console.log(`✅ ${settlementCount} settlement records created`);

  // ============================================
  // BACKUP PLACEMENTS
  // ============================================
  console.log('\n📦 Seeding Backup Placements...');

  const backupStatuses = ['OK', 'AT_RISK', 'CRITICAL'];
  let backupCount = 0;

  for (const site of createdSites) {
    const status = randomPick(backupStatuses);
    const urgencyLevel = status === 'CRITICAL' ? 'HIGH' : status === 'AT_RISK' ? 'MEDIUM' : 'LOW';

    await prisma.backupPlacement.create({
      data: {
        siteId: site.id,
        currentBatteryCapacity: randomInRange(5, 20),
        currentGensetCapacity: site.hasGenset ? randomInRange(50, 200) : null,
        currentRectifierSize: randomInRange(50, 300),
        batterySOH: randomInRange(30, 100),
        recommendedBatteryCapacity: randomInRange(10, 30),
        recommendedGensetCapacity: randomInRange(100, 300),
        recommendedRectifierSize: randomInRange(100, 400),
        urgencyLevel,
        priorityScore: randomInRange(0, 100),
        avgOutageFrequency: randomInRange(0, 10),
        avgOutageDuration: randomInRange(0.5, 5),
        lastOutageDate: randomPastDate(30),
        predictedBackupDuration: randomInRange(2, 12),
        riskScore: randomInRange(0, 100),
        status,
      },
    });
    backupCount++;
  }
  console.log(`✅ ${backupCount} backup placement records created`);

  // ============================================
  // ANOMALY ALERTS
  // ============================================
  console.log('\n📦 Seeding Anomaly Alerts...');

  const alertTypes = [
    AlertType.POWER_CONSUMPTION_ANOMALY,
    AlertType.BILLING_MISMATCH,
    AlertType.SETTLEMENT_INVALID,
    AlertType.BACKUP_CRITICAL,
    AlertType.BATTERY_LOW,
    AlertType.OUTAGE_PREDICTED,
    AlertType.ISR_EXPIRED,
    AlertType.NMS_MISMATCH,
  ];
  const severities = [AlertSeverity.CRITICAL, AlertSeverity.HIGH, AlertSeverity.MEDIUM, AlertSeverity.LOW, AlertSeverity.INFO];
  const alertStatuses = [AlertStatus.OPEN, AlertStatus.ACKNOWLEDGED, AlertStatus.IN_PROGRESS, AlertStatus.RESOLVED, AlertStatus.CLOSED];

  const createdAlerts: any[] = [];
  for (let i = 0; i < 100; i++) {
    const type = randomPick(alertTypes);
    const severity = randomPick(severities);
    const status = randomPick(alertStatuses);
    const site = randomPick(createdSites);
    const powerUsage = powerUsages.length > 0 ? randomPick(powerUsages) : null;

    const alert = await prisma.anomalyAlert.create({
      data: {
        usageId: type === AlertType.POWER_CONSUMPTION_ANOMALY && powerUsage ? powerUsage.id : null,
        siteId: site.siteId,
        type,
        severity,
        title: `${type.replace(/_/g, ' ')} - ${site.siteId}`,
        description: `Detected ${type.toLowerCase().replace(/_/g, ' ')} at site ${site.siteId}. Requires attention.`,
        detectedValue: randomInRange(100, 1000),
        expectedValue: randomInRange(80, 120),
        threshold: randomInRange(90, 110),
        deviationPercent: randomInRange(5, 50),
        status,
        acknowledgedAt: status !== AlertStatus.OPEN ? randomPastDate(7) : null,
        acknowledgedBy: status !== AlertStatus.OPEN ? randomPick(technicians).name : null,
        resolvedAt: (status === AlertStatus.RESOLVED || status === AlertStatus.CLOSED) ? randomPastDate(3) : null,
        resolvedBy: (status === AlertStatus.RESOLVED || status === AlertStatus.CLOSED) ? randomPick(technicians).name : null,
        resolution: (status === AlertStatus.RESOLVED || status === AlertStatus.CLOSED) ? 'Issue resolved after investigation' : null,
        createdAt: randomPastDate(30),
      },
    });
    createdAlerts.push(alert);
  }
  console.log(`✅ ${createdAlerts.length} anomaly alerts created`);

  // ============================================
  // TICKETS
  // ============================================
  console.log('\n📦 Seeding Tickets...');

  const ticketPriorities = [TicketPriority.CRITICAL, TicketPriority.HIGH, TicketPriority.MEDIUM, TicketPriority.LOW];
  const ticketStatuses = [TicketStatus.OPEN, TicketStatus.ASSIGNED, TicketStatus.IN_PROGRESS, TicketStatus.PENDING, TicketStatus.RESOLVED, TicketStatus.CLOSED];
  const categories = ['Power', 'Network', 'Hardware', 'Software', 'Maintenance'];

  let ticketCount = 0;
  for (const alert of createdAlerts.slice(0, 50)) {
    const priority = randomPick(ticketPriorities);
    const status = randomPick(ticketStatuses);
    const assignee = status !== TicketStatus.OPEN ? randomPick(technicians) : null;

    const ticket = await prisma.ticket.create({
      data: {
        ticketNumber: `TKT-${Date.now()}-${ticketCount}`,
        alertId: alert.id,
        title: alert.title,
        description: alert.description,
        priority,
        status,
        assignedToId: assignee?.id,
        assignedAt: assignee ? randomPastDate(7) : null,
        slaDeadline: new Date(Date.now() + randomInRange(4, 72) * 60 * 60 * 1000),
        slaStatus: randomPick([SLAStatus.ON_TIME, SLAStatus.AT_RISK, SLAStatus.BREACHED]),
        resolution: (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) ? 'Issue resolved' : null,
        resolvedAt: (status === TicketStatus.RESOLVED || status === TicketStatus.CLOSED) ? randomPastDate(3) : null,
        closedAt: status === TicketStatus.CLOSED ? randomPastDate(1) : null,
        tags: [randomPick(categories), alert.type.toLowerCase()],
        category: randomPick(categories),
        createdAt: randomPastDate(14),
      },
    });
    ticketCount++;

    // Add comments
    if (Math.random() > 0.5) {
      await prisma.ticketComment.create({
        data: {
          ticketId: ticket.id,
          userId: randomPick(technicians).id,
          comment: 'Initial investigation started. Will update soon.',
          isInternal: false,
        },
      });
    }

    // Add history
    await prisma.ticketHistory.create({
      data: {
        ticketId: ticket.id,
        userId: admin.id,
        action: 'CREATED',
        fieldName: 'status',
        oldValue: null,
        newValue: 'OPEN',
      },
    });
  }
  console.log(`✅ ${ticketCount} tickets created`);

  // ============================================
  // NOTIFICATIONS
  // ============================================
  console.log('\n📦 Seeding Notifications...');

  const notificationChannels = [NotificationChannel.IN_APP, NotificationChannel.EMAIL];
  const notificationStatuses = [NotificationStatus.PENDING, NotificationStatus.SENT, NotificationStatus.READ];

  let notificationCount = 0;
  const allUsers = [admin, manager, analyst, ops, ...technicians];
  
  for (const alert of createdAlerts.slice(0, 30)) {
    const user = randomPick(allUsers);
    await prisma.notification.create({
      data: {
        userId: user.id,
        alertId: alert.id,
        type: NotificationType.ALERT,
        channel: randomPick(notificationChannels),
        title: `Alert: ${alert.title}`,
        message: alert.description,
        status: randomPick(notificationStatuses),
        sentAt: randomPastDate(7),
        readAt: Math.random() > 0.5 ? randomPastDate(3) : null,
      },
    });
    notificationCount++;
  }
  console.log(`✅ ${notificationCount} notifications created`);

  // ============================================
  // SYSTEM CONFIGS
  // ============================================
  console.log('\n📦 Seeding System Configs...');

  const configs = [
    { key: 'ANOMALY_THRESHOLD_PERCENTAGE', value: '10', description: 'Threshold percentage for anomaly detection', category: 'ALERT' },
    { key: 'SLA_CRITICAL_HOURS', value: '4', description: 'SLA hours for critical tickets', category: 'TICKET' },
    { key: 'SLA_HIGH_HOURS', value: '8', description: 'SLA hours for high priority tickets', category: 'TICKET' },
    { key: 'SLA_MEDIUM_HOURS', value: '24', description: 'SLA hours for medium priority tickets', category: 'TICKET' },
    { key: 'SLA_LOW_HOURS', value: '72', description: 'SLA hours for low priority tickets', category: 'TICKET' },
    { key: 'BATTERY_LOW_THRESHOLD', value: '20', description: 'Battery SOH threshold for low warning', category: 'BACKUP' },
    { key: 'BATTERY_CRITICAL_THRESHOLD', value: '10', description: 'Battery SOH threshold for critical warning', category: 'BACKUP' },
    { key: 'ISR_EXPIRY_WARNING_DAYS', value: '30', description: 'Days before ISR expiry to send warning', category: 'SETTLEMENT' },
    { key: 'POWER_DEVIATION_THRESHOLD', value: '15', description: 'Power consumption deviation threshold percentage', category: 'POWER' },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
    console.log('✅ System config created:', config.key);
  }

  // ============================================
  // SUMMARY
  // ============================================
  console.log('\n🎉 Database seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   - Users: ${allUsers.length}`);
  console.log(`   - Sites: ${createdSites.length}`);
  console.log(`   - Power Usages: ${powerUsages.length}`);
  console.log(`   - Clustering Results: ${clusterCount}`);
  console.log(`   - Settlements: ${settlementCount}`);
  console.log(`   - Backup Placements: ${backupCount}`);
  console.log(`   - Anomaly Alerts: ${createdAlerts.length}`);
  console.log(`   - Tickets: ${ticketCount}`);
  console.log(`   - Notifications: ${notificationCount}`);
  console.log(`   - System Configs: ${configs.length}`);
  
  console.log('\n📝 Default credentials:');
  console.log('Admin: admin@arsenal.com / admin123');
  console.log('Manager: manager@arsenal.com / manager123');
  console.log('Analyst: analyst@arsenal.com / analyst123');
  console.log('Ops: ops@arsenal.com / ops123');
  console.log('Technicians: [name]@arsenal.com / tech123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
