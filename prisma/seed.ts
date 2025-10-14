import { PrismaClient, UserRole, SiteTier } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seeding...');

  // Create admin user
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

  // Create manager user
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

  // Create analyst user
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

  // Create ops user
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

  // Create sample sites
  const sites = [
    {
      siteId: 'JKT-001',
      siteName: 'Jakarta Central BTS',
      region: 'Jakarta',
      latitude: -6.2088,
      longitude: 106.8456,
      capacity: 5000,
      tier: SiteTier.PLATINUM,
      topology: 'Macro',
      rectifierCapacity: 200,
      acUnits: 4,
      hasGenset: true,
      climateZone: 'Tropical',
      locationType: 'Urban',
    },
    {
      siteId: 'JKT-002',
      siteName: 'Jakarta South BTS',
      region: 'Jakarta',
      latitude: -6.2615,
      longitude: 106.8106,
      capacity: 3000,
      tier: SiteTier.GOLD,
      topology: 'Macro',
      rectifierCapacity: 150,
      acUnits: 2,
      hasGenset: true,
      climateZone: 'Tropical',
      locationType: 'Urban',
    },
    {
      siteId: 'BDG-001',
      siteName: 'Bandung North BTS',
      region: 'Bandung',
      latitude: -6.9175,
      longitude: 107.6191,
      capacity: 2000,
      tier: SiteTier.SILVER,
      topology: 'Micro',
      rectifierCapacity: 100,
      acUnits: 2,
      hasGenset: false,
      climateZone: 'Tropical',
      locationType: 'Suburban',
    },
  ];

  for (const siteData of sites) {
    const site = await prisma.site.upsert({
      where: { siteId: siteData.siteId },
      update: {},
      create: siteData,
    });
    console.log('✅ Site created:', site.siteId);
  }

  // Create system configs
  const configs = [
    {
      key: 'ANOMALY_THRESHOLD_PERCENTAGE',
      value: '10',
      description: 'Threshold percentage for anomaly detection',
      category: 'ALERT',
    },
    {
      key: 'SLA_CRITICAL_HOURS',
      value: '4',
      description: 'SLA hours for critical tickets',
      category: 'TICKET',
    },
    {
      key: 'SLA_HIGH_HOURS',
      value: '8',
      description: 'SLA hours for high priority tickets',
      category: 'TICKET',
    },
    {
      key: 'SLA_MEDIUM_HOURS',
      value: '24',
      description: 'SLA hours for medium priority tickets',
      category: 'TICKET',
    },
    {
      key: 'SLA_LOW_HOURS',
      value: '72',
      description: 'SLA hours for low priority tickets',
      category: 'TICKET',
    },
  ];

  for (const config of configs) {
    await prisma.systemConfig.upsert({
      where: { key: config.key },
      update: {},
      create: config,
    });
    console.log('✅ System config created:', config.key);
  }

  console.log('🎉 Database seeding completed!');
  console.log('\n📝 Default credentials:');
  console.log('Admin: admin@arsenal.com / admin123');
  console.log('Manager: manager@arsenal.com / manager123');
  console.log('Analyst: analyst@arsenal.com / analyst123');
  console.log('Ops: ops@arsenal.com / ops123');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
