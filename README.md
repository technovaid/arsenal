# ARSeNAL Backend API

Backend Integration API & Alert Ticketing System untuk ARSeNAL (Smart Energy & Site Optimization System).

## 📚 API Documentation

**Swagger UI**: [http://localhost:3000/api-docs](http://localhost:3000/api-docs)

Dokumentasi lengkap tersedia di [API_DOCUMENTATION.md](./API_DOCUMENTATION.md)

## 📋 Deskripsi

Backend API ini bertanggung jawab untuk:
- **Alert Management**: Deteksi dan manajemen anomali konsumsi energi
- **Ticketing System**: Sistem tiket otomatis untuk penanganan alert
- **Real-time Notifications**: Notifikasi real-time via Socket.IO dan email
- **Data Integration**: Integrasi dengan berbagai sumber data (AMR, PLN, NMS, ISR, dll)
- **Authentication & Authorization**: Sistem autentikasi berbasis JWT dengan role-based access control

## 🛠️ Tech Stack

- **Runtime**: Node.js 18+
- **Framework**: Express.js + TypeScript
- **Database**: PostgreSQL
- **ORM**: Prisma
- **Cache**: Redis
- **Real-time**: Socket.IO
- **Authentication**: JWT (jsonwebtoken)
- **Email**: Nodemailer
- **Logging**: Winston
- **Validation**: express-validator
- **Documentation**: Swagger/OpenAPI

## 📁 Struktur Proyek

```
backend/
├── prisma/
│   ├── schema.prisma          # Database schema
│   └── migrations/            # Database migrations
├── src/
│   ├── config/               # Configuration files
│   │   ├── database.ts       # Prisma client
│   │   └── redis.ts          # Redis client
│   ├── controllers/          # Request handlers
│   │   ├── alert.controller.ts
│   │   ├── ticket.controller.ts
│   │   └── auth.controller.ts
│   ├── middlewares/          # Express middlewares
│   │   ├── auth.ts           # Authentication & authorization
│   │   ├── errorHandler.ts   # Error handling
│   │   ├── validator.ts      # Request validation
│   │   └── rateLimiter.ts    # Rate limiting
│   ├── routes/               # API routes
│   │   ├── index.ts
│   │   ├── alert.routes.ts
│   │   ├── ticket.routes.ts
│   │   └── auth.routes.ts
│   ├── services/             # Business logic
│   │   ├── alert.service.ts
│   │   ├── ticket.service.ts
│   │   ├── notification.service.ts
│   │   ├── socket.service.ts
│   │   └── auth.service.ts
│   ├── utils/                # Utility functions
│   │   ├── logger.ts
│   │   ├── ApiError.ts
│   │   └── ApiResponse.ts
│   └── server.ts             # Application entry point
├── .env.example              # Environment variables template
├── package.json
├── tsconfig.json
└── README.md
```

## 🚀 Getting Started

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL >= 14
- Redis >= 6
- npm >= 9.0.0

### Installation

1. **Clone repository dan masuk ke direktori backend**
   ```bash
   cd backend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   cp .env.example .env
   ```
   
   Edit file `.env` dan sesuaikan dengan konfigurasi Anda:
   ```env
   DATABASE_URL="postgresql://username:password@localhost:5432/arsenal_db"
   JWT_SECRET=your-secret-key
   REDIS_HOST=localhost
   SMTP_HOST=smtp.gmail.com
   SMTP_USER=your-email@gmail.com
   # ... dan lainnya
   ```

4. **Setup database**
   ```bash
   # Generate Prisma client
   npm run prisma:generate
   
   # Run migrations
   npm run prisma:migrate
   
   # (Optional) Seed database
   npm run prisma:seed
   ```

5. **Start development server**
   ```bash
   npm run dev
   ```

   Server akan berjalan di `http://localhost:3000`

### Production Build

```bash
# Build TypeScript
npm run build

# Start production server
npm start
```

## 📡 API Endpoints

### Authentication

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/auth/register` | Register user baru | Public |
| POST | `/api/v1/auth/login` | Login user | Public |
| POST | `/api/v1/auth/refresh-token` | Refresh access token | Public |
| GET | `/api/v1/auth/profile` | Get user profile | Private |
| POST | `/api/v1/auth/change-password` | Change password | Private |

### Alerts

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/alerts` | Create alert | OPS, ANALYST, ADMIN |
| GET | `/api/v1/alerts` | Get all alerts | Private |
| GET | `/api/v1/alerts/:id` | Get alert by ID | Private |
| PATCH | `/api/v1/alerts/:id` | Update alert | OPS, ANALYST, MANAGER, ADMIN |
| POST | `/api/v1/alerts/:id/acknowledge` | Acknowledge alert | OPS, ANALYST, MANAGER, ADMIN |
| POST | `/api/v1/alerts/:id/resolve` | Resolve alert | OPS, ANALYST, MANAGER, ADMIN |
| GET | `/api/v1/alerts/statistics` | Get alert statistics | Private |
| DELETE | `/api/v1/alerts/:id` | Delete alert | ADMIN |

### Tickets

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| POST | `/api/v1/tickets` | Create ticket | OPS, ANALYST, MANAGER, ADMIN |
| GET | `/api/v1/tickets` | Get all tickets | Private |
| GET | `/api/v1/tickets/:id` | Get ticket by ID | Private |
| PATCH | `/api/v1/tickets/:id` | Update ticket | OPS, ANALYST, MANAGER, ADMIN |
| POST | `/api/v1/tickets/:id/comments` | Add comment | OPS, ANALYST, MANAGER, ADMIN |
| GET | `/api/v1/tickets/statistics` | Get ticket statistics | Private |

### Notifications

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/notifications` | Get user notifications | Private |
| PATCH | `/api/v1/notifications/:id/read` | Mark as read | Private |

### Sites

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/sites` | Get all sites | Private |
| GET | `/api/v1/sites/:id` | Get site by ID | Private |
| POST | `/api/v1/sites` | Create site | ADMIN |
| PATCH | `/api/v1/sites/:id` | Update site | ADMIN |

### Power Usage

| Method | Endpoint | Description | Access |
|--------|----------|-------------|--------|
| GET | `/api/v1/power-usage` | Get power usage data | Private |
| GET | `/api/v1/power-usage/:siteId` | Get by site | Private |
| POST | `/api/v1/power-usage` | Create record | ADMIN |

## 🔐 Authentication

API menggunakan JWT (JSON Web Token) untuk autentikasi. Setelah login, Anda akan menerima `accessToken` dan `refreshToken`.

### Cara menggunakan:

1. **Login** untuk mendapatkan token:
   ```bash
   POST /api/v1/auth/login
   {
     "email": "user@example.com",
     "password": "password123"
   }
   ```

2. **Gunakan access token** di header request:
   ```
   Authorization: Bearer <access_token>
   ```

3. **Refresh token** ketika access token expired:
   ```bash
   POST /api/v1/auth/refresh-token
   {
     "refreshToken": "<refresh_token>"
   }
   ```

## 👥 User Roles

| Role | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | Administrator | Full access ke semua fitur |
| **MANAGER** | Manager | View semua data, manage tickets |
| **ANALYST** | Data Analyst | View & analyze data, create alerts |
| **OPS** | Operations Team | Handle alerts & tickets |
| **VIEWER** | Read-only User | View data only |

## 🔔 Real-time Features (Socket.IO)

### Connection

```javascript
import io from 'socket.io-client';

const socket = io('http://localhost:3000', {
  auth: {
    token: 'your-jwt-token'
  }
});
```

### Events

**Subscribe to alerts:**
```javascript
socket.emit('subscribe:alerts');

socket.on('alert:new', (data) => {
  console.log('New alert:', data);
});

socket.on('alert:updated', (data) => {
  console.log('Alert updated:', data);
});
```

**Subscribe to tickets:**
```javascript
socket.emit('subscribe:tickets');

socket.on('ticket:new', (data) => {
  console.log('New ticket:', data);
});

socket.on('ticket:assigned', (data) => {
  console.log('Ticket assigned to you:', data);
});
```

## 📊 Database Schema

### Key Entities

- **User**: User accounts dengan role-based access
- **Site**: Site telekomunikasi (BTS)
- **PowerUsage**: Data konsumsi daya dan billing
- **AnomalyAlert**: Alert anomali yang terdeteksi
- **Ticket**: Tiket untuk penanganan alert
- **Notification**: Notifikasi untuk user
- **Settlement**: Data settlement ISR dan sewa site
- **BackupPlacement**: Data backup power placement

Lihat `prisma/schema.prisma` untuk detail lengkap.

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm test -- --coverage

# Watch mode
npm run test:watch
```

## 📝 Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server dengan hot reload |
| `npm run build` | Build TypeScript ke JavaScript |
| `npm start` | Start production server |
| `npm run prisma:generate` | Generate Prisma client |
| `npm run prisma:migrate` | Run database migrations |
| `npm run prisma:studio` | Open Prisma Studio (GUI) |
| `npm test` | Run tests |
| `npm run lint` | Run ESLint |
| `npm run format` | Format code dengan Prettier |

## 🔧 Configuration

### Environment Variables

Lihat `.env.example` untuk daftar lengkap environment variables yang diperlukan.

### Rate Limiting

Default: 100 requests per 15 menit per IP address. Dapat dikonfigurasi via:
```env
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

### Email Notifications

Untuk mengaktifkan email notifications:
```env
ALERT_EMAIL_ENABLED=true
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-app-password
```

## 🐛 Error Handling

API menggunakan centralized error handling. Semua error akan dikembalikan dalam format:

```json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### HTTP Status Codes

- `200` - Success
- `201` - Created
- `204` - No Content
- `400` - Bad Request
- `401` - Unauthorized
- `403` - Forbidden
- `404` - Not Found
- `409` - Conflict
- `500` - Internal Server Error

## 📈 Monitoring & Logging

### Logging

Logs disimpan di direktori `logs/`:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs

Log level dapat dikonfigurasi via `LOG_LEVEL` environment variable.

### Health Check

```bash
GET /health
```

Response:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 12345.67,
  "environment": "development"
}
```

## 🔄 Integration dengan External APIs

Backend ini dirancang untuk integrasi dengan:
- **AMR API**: Data konsumsi listrik otomatis
- **PLN API**: Data tagihan PLN
- **NMS API**: Network Management System
- **ISR API**: Data Izin Stasiun Radio
- **MW OSS API**: Microwave OSS data

Konfigurasi endpoint dan API keys di `.env`:
```env
AMR_API_URL=https://api.amr.example.com
AMR_API_KEY=your-api-key
PLN_API_URL=https://api.pln.example.com
PLN_API_KEY=your-api-key
# ... dst
```

## 🚀 Deployment

### Docker (Recommended)

```bash
# Build image
docker build -t arsenal-backend .

# Run container
docker run -p 3000:3000 --env-file .env arsenal-backend
```

### Manual Deployment

1. Build aplikasi: `npm run build`
2. Setup PostgreSQL dan Redis
3. Set environment variables
4. Run migrations: `npm run prisma:migrate`
5. Start server: `npm start`

## 📚 Additional Resources

- [Prisma Documentation](https://www.prisma.io/docs)
- [Express.js Documentation](https://expressjs.com/)
- [Socket.IO Documentation](https://socket.io/docs/)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)

## 👨‍💻 Development

### Code Style

Project menggunakan ESLint dan Prettier untuk code formatting. Run:
```bash
npm run lint        # Check linting
npm run lint:fix    # Fix linting issues
npm run format      # Format code
```

### Database Migrations

Setiap perubahan schema harus dibuat migration:
```bash
npx prisma migrate dev --name description_of_changes
```

## 📞 Support

Untuk pertanyaan atau issue, silakan hubungi tim Backend Development.

## 📄 License

MIT License - Copyright (c) 2024 ARSeNAL Team
