# Database Seeding Summary

## Overview

This document summarizes the comprehensive database seeding implemented for the ARSeNAL Backend API.

## Seed Data Created

| Model | Count | Description |
|-------|-------|-------------|
| **Users** | 9 | Admin, Manager, Analyst, Ops, 5 Technicians |
| **Sites** | 92 | Across 8 regions (Jakarta, Bandung, Surabaya, Medan, Makassar, Palembang, Semarang, Yogyakarta) |
| **Power Usages** | 480 | 12 months of historical data for 40 sites |
| **Clustering Results** | 150 | Efficiency clustering data |
| **Settlements** | 92 | ISR/NMS data with detection results |
| **Backup Placements** | 92 | Battery/genset data with risk scores |
| **Anomaly Alerts** | 100 | Various alert types and severities |
| **Tickets** | 50 | Linked to alerts with comments and history |
| **Notifications** | 30 | Alert notifications for users |
| **System Configs** | 9 | Configuration values |

## Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@arsenal.com | admin123 |
| Manager | manager@arsenal.com | manager123 |
| Analyst | analyst@arsenal.com | analyst123 |
| Ops | ops@arsenal.com | ops123 |
| Technicians | budi.santoso@arsenal.com | tech123 |
| Technicians | andi.wijaya@arsenal.com | tech123 |
| Technicians | dewi.lestari@arsenal.com | tech123 |
| Technicians | rudi.hartono@arsenal.com | tech123 |
| Technicians | siti.rahayu@arsenal.com | tech123 |

## Prisma Models

### User Management
- **User** - User accounts with roles (ADMIN, MANAGER, ANALYST, OPS, VIEWER)

### Site Management
- **Site** - Site data with location, tier (PLATINUM, GOLD, SILVER, BRONZE), capacity, and technical specs

### Power Usage & Billing (Use Case 1)
- **PowerUsage** - Power consumption and billing data with predictions
- **ClusteringResult** - ML clustering results for efficiency analysis

### Settlement (Use Case 2)
- **Settlement** - ISR/NMS settlement data with detection results (VALID, INVALID, MISMATCH, EXPIRED)

### Power Backup (Use Case 3)
- **BackupPlacement** - Battery/genset configuration with risk scores and urgency levels

### Alert & Anomaly Detection
- **AnomalyAlert** - Anomaly alerts with various types and severities

### Ticketing System
- **Ticket** - Tickets linked to alerts with SLA tracking
- **TicketComment** - Comments on tickets
- **TicketHistory** - Audit history for tickets

### Notification System
- **Notification** - User notifications via IN_APP or EMAIL

### System Configuration
- **SystemConfig** - System configuration values

## API Endpoints Supported

### Dashboard
- `GET /api/v1/dashboard/summary` - Dashboard summary
- `GET /api/v1/dashboard/heatmap` - Site heatmap data

### Sites
- `GET /api/v1/sites` - List sites with filtering & pagination
- `GET /api/v1/sites/regions` - Available regions
- `GET /api/v1/sites/:siteId` - Site detail

### Power Usage
- `GET /api/v1/power-usage/:siteId` - Site power usage history

### Anomalies
- `GET /api/v1/anomalies` - List anomalies with filtering & pagination
- `GET /api/v1/anomalies/summary` - Anomaly summary counts

### Settlements
- `GET /api/v1/settlements` - List settlements with filtering & pagination
- `GET /api/v1/settlements/summary` - Settlement summary (mismatch counts)
- `GET /api/v1/settlements/regions` - Available regions
- `GET /api/v1/settlements/:siteId` - Settlement detail
- `GET /api/v1/settlements/:siteId/work-orders` - Work order history

### Power Backup
- `GET /api/v1/power-backup` - List power backup sites with filtering & pagination
- `GET /api/v1/power-backup/regions` - Available regions
- `GET /api/v1/power-backup/:siteId` - Power backup site detail
- `GET /api/v1/power-backup/:siteId/power-analysis` - Power analysis data
- `GET /api/v1/power-backup/:siteId/outage-history` - Outage history (12 months)
- `GET /api/v1/power-backup/:siteId/battery-health` - Battery health trend (30 days)

## How to Run Seeding

```bash
# From the backend directory
npm run prisma:seed

# Or using npx
npx prisma db seed
```

## Files

- **Seed Script**: `prisma/seed.ts`
- **Schema**: `prisma/schema.prisma`
- **Package Config**: `package.json` (prisma.seed configuration)

## Notes

- All data is randomly generated with realistic values
- Sites are distributed across 8 Indonesian regions
- Power usage data spans 12 months for historical analysis
- Alerts and tickets have various statuses for testing workflows
- The seed script uses `upsert` for users and sites to avoid duplicates on re-run
