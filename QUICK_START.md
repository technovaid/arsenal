# 🚀 ARSeNAL Backend - Quick Start Guide

## 📋 Prerequisites

- Docker & Docker Compose
- Node.js 18+ (for local development)
- PostgreSQL 14+ (or use Docker)
- Redis 6+ (or use Docker)

## ⚡ Quick Start (Docker - Recommended)

### 1. Start All Services

```bash
cd backend
docker-compose up -d
```

This will start:
- PostgreSQL (port 5432)
- Redis (port 6379)
- Backend API (port 3000)

### 2. Run Database Migrations

```bash
npm install
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 3. Verify Services

```bash
# Check containers
docker-compose ps

# Check API health
curl http://localhost:3000/health

# Check Swagger docs
open http://localhost:3000/api-docs
```

## 🔐 Default Credentials

| Role | Email | Password |
|------|-------|----------|
| Admin | admin@arsenal.com | admin123 |
| Manager | manager@arsenal.com | manager123 |
| Analyst | analyst@arsenal.com | analyst123 |
| Ops | ops@arsenal.com | ops123 |

## 🎯 Test API

### 1. Login

```bash
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arsenal.com","password":"admin123"}'
```

Copy the `accessToken` from response.

### 2. Get Alerts

```bash
TOKEN="your-access-token-here"

curl -X GET http://localhost:3000/api/v1/alerts \
  -H "Authorization: Bearer $TOKEN"
```

### 3. Create Alert

```bash
curl -X POST http://localhost:3000/api/v1/alerts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ANOMALY",
    "severity": "HIGH",
    "title": "Test Alert",
    "description": "This is a test alert",
    "siteId": "JKT-001"
  }'
```

## 📚 Documentation

- **Swagger UI**: http://localhost:3000/api-docs
- **API Docs**: [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)
- **Full README**: [README.md](./README.md)

## 🛠️ Useful Commands

```bash
# Stop all services
docker-compose down

# View logs
docker logs arsenal-backend -f

# Restart backend
docker-compose restart backend

# Rebuild backend
docker-compose build backend
docker-compose up -d backend

# Access PostgreSQL
docker exec -it arsenal-postgres psql -U arsenal -d arsenal_db

# Access Redis
docker exec -it arsenal-redis redis-cli
```

## 🔄 Development Workflow

### Local Development (without Docker)

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your local database credentials

# Generate Prisma client
npm run prisma:generate

# Run migrations
npm run prisma:migrate

# Seed database
npm run prisma:seed

# Start dev server
npm run dev
```

Server will run at `http://localhost:3000` with hot reload.

## 📊 Database

### View Tables

```bash
docker exec -it arsenal-postgres psql -U arsenal -d arsenal_db -c "\dt"
```

### View Users

```bash
docker exec -it arsenal-postgres psql -U arsenal -d arsenal_db -c "SELECT email, name, role FROM users;"
```

### View Sites

```bash
docker exec -it arsenal-postgres psql -U arsenal -d arsenal_db -c "SELECT site_id, site_name, region FROM sites;"
```

## 🐛 Troubleshooting

### Port already in use

```bash
# Stop existing services
docker-compose down

# Or change ports in docker-compose.yml
```

### Database connection error

```bash
# Check if PostgreSQL is running
docker ps | grep postgres

# Check database credentials in .env
cat .env | grep DATABASE_URL
```

### Cannot access Swagger UI

```bash
# Check if backend is running
curl http://localhost:3000/health

# Restart backend
docker-compose restart backend
```

## 🎉 You're Ready!

Access Swagger UI to explore and test all API endpoints:

**http://localhost:3000/api-docs**

Happy coding! 🚀
