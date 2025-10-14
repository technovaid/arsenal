# Setup Guide - ARSeNAL Backend

## Quick Start

### 1. Install Dependencies
```bash
cd backend
npm install
```

### 2. Configure Environment
```bash
cp .env.example .env
# Edit .env dengan konfigurasi Anda
```

### 3. Setup Database
```bash
npm run prisma:generate
npm run prisma:migrate
npm run prisma:seed
```

### 4. Start Development Server
```bash
npm run dev
```

Server akan berjalan di `http://localhost:3000`

## Default Credentials

- **Admin**: admin@arsenal.com / admin123
- **Manager**: manager@arsenal.com / manager123
- **Analyst**: analyst@arsenal.com / analyst123
- **Ops**: ops@arsenal.com / ops123

## Docker Setup

```bash
docker-compose up -d
```

## API Testing

Gunakan Postman atau curl untuk testing:

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arsenal.com","password":"admin123"}'

# Get alerts (dengan token)
curl -X GET http://localhost:3000/api/v1/alerts \
  -H "Authorization: Bearer YOUR_TOKEN"
```
