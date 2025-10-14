# ARSeNAL API Documentation

## 📚 Swagger/OpenAPI Documentation

API documentation tersedia melalui Swagger UI yang interaktif.

### Akses Dokumentasi

**Development:**
- Swagger UI: http://localhost:3000/api-docs
- OpenAPI JSON: http://localhost:3000/api-docs.json

**Production:**
- Swagger UI: https://api.arsenal.com/api-docs
- OpenAPI JSON: https://api.arsenal.com/api-docs.json

## 🚀 Quick Start

### 1. Akses Swagger UI

Buka browser dan navigasi ke:
```
http://localhost:3000/api-docs
```

### 2. Authenticate

Untuk menggunakan endpoint yang memerlukan autentikasi:

1. **Login** terlebih dahulu melalui endpoint `/api/v1/auth/login`:
   - Klik endpoint "POST /api/v1/auth/login"
   - Klik "Try it out"
   - Masukkan credentials:
     ```json
     {
       "email": "admin@arsenal.com",
       "password": "admin123"
     }
     ```
   - Klik "Execute"
   - Copy `accessToken` dari response

2. **Authorize** di Swagger UI:
   - Klik tombol "Authorize" 🔒 di bagian atas
   - Masukkan: `Bearer <accessToken>`
   - Klik "Authorize"
   - Sekarang Anda bisa mengakses semua protected endpoints

### 3. Test Endpoints

Setelah authenticated, Anda bisa test semua endpoints:
- Klik endpoint yang ingin ditest
- Klik "Try it out"
- Isi parameter/body yang diperlukan
- Klik "Execute"
- Lihat response di bagian bawah

## 📋 API Endpoints Overview

### Authentication
- `POST /api/v1/auth/register` - Register user baru
- `POST /api/v1/auth/login` - Login user
- `POST /api/v1/auth/refresh-token` - Refresh access token
- `GET /api/v1/auth/profile` - Get user profile
- `POST /api/v1/auth/change-password` - Change password

### Alerts
- `GET /api/v1/alerts` - Get all alerts (with filters)
- `POST /api/v1/alerts` - Create new alert
- `GET /api/v1/alerts/statistics` - Get alert statistics
- `GET /api/v1/alerts/:id` - Get alert by ID
- `PATCH /api/v1/alerts/:id` - Update alert
- `DELETE /api/v1/alerts/:id` - Delete alert
- `POST /api/v1/alerts/:id/acknowledge` - Acknowledge alert
- `POST /api/v1/alerts/:id/resolve` - Resolve alert

### Tickets
- `GET /api/v1/tickets` - Get all tickets (with filters)
- `POST /api/v1/tickets` - Create new ticket
- `GET /api/v1/tickets/statistics` - Get ticket statistics
- `GET /api/v1/tickets/:id` - Get ticket by ID
- `PATCH /api/v1/tickets/:id` - Update ticket
- `POST /api/v1/tickets/:id/comments` - Add comment to ticket

### Notifications
- `GET /api/v1/notifications` - Get user notifications
- `PATCH /api/v1/notifications/:id/read` - Mark notification as read

### Sites
- `GET /api/v1/sites` - Get all sites
- `GET /api/v1/sites/:id` - Get site by ID
- `POST /api/v1/sites` - Create new site (Admin only)
- `PATCH /api/v1/sites/:id` - Update site (Admin only)

### Power Usage
- `GET /api/v1/power-usage` - Get power usage data
- `GET /api/v1/power-usage/:siteId` - Get power usage by site
- `POST /api/v1/power-usage` - Create power usage record (Admin only)

## 🔐 Authentication

API menggunakan JWT (JSON Web Token) untuk autentikasi.

### Login Flow

1. **Login** dengan credentials:
   ```bash
   POST /api/v1/auth/login
   {
     "email": "admin@arsenal.com",
     "password": "admin123"
   }
   ```

2. **Response** akan berisi:
   ```json
   {
     "success": true,
     "message": "Login successful",
     "data": {
       "user": { ... },
       "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
       "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
     }
   }
   ```

3. **Gunakan** access token di header:
   ```
   Authorization: Bearer <accessToken>
   ```

4. **Refresh** token ketika expired:
   ```bash
   POST /api/v1/auth/refresh-token
   {
     "refreshToken": "<refreshToken>"
   }
   ```

## 👥 User Roles & Permissions

| Role | Description | Permissions |
|------|-------------|-------------|
| **ADMIN** | Administrator | Full access ke semua fitur |
| **MANAGER** | Manager | View semua data, manage tickets |
| **ANALYST** | Data Analyst | View & analyze data, create alerts |
| **OPS** | Operations Team | Handle alerts & tickets |
| **VIEWER** | Read-only User | View data only |

## 📊 Response Format

### Success Response
```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Paginated Response
```json
{
  "success": true,
  "message": "Success",
  "data": [ ... ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 100,
    "totalPages": 5
  },
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Error Response
```json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

## 🔢 HTTP Status Codes

| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request - Validation error |
| 401 | Unauthorized - Invalid or missing token |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found |
| 409 | Conflict |
| 500 | Internal Server Error |

## 🎯 Example Usage

### Using cURL

```bash
# Login
curl -X POST http://localhost:3000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@arsenal.com","password":"admin123"}'

# Get alerts (with token)
TOKEN="your-access-token"
curl -X GET http://localhost:3000/api/v1/alerts \
  -H "Authorization: Bearer $TOKEN"

# Create alert
curl -X POST http://localhost:3000/api/v1/alerts \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "ANOMALY",
    "severity": "HIGH",
    "title": "High power consumption",
    "description": "Power exceeded threshold",
    "siteId": "JKT-001"
  }'
```

### Using JavaScript/Fetch

```javascript
// Login
const loginResponse = await fetch('http://localhost:3000/api/v1/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    email: 'admin@arsenal.com',
    password: 'admin123'
  })
});
const { data } = await loginResponse.json();
const token = data.accessToken;

// Get alerts
const alertsResponse = await fetch('http://localhost:3000/api/v1/alerts', {
  headers: { 'Authorization': `Bearer ${token}` }
});
const alerts = await alertsResponse.json();
```

### Using Python/Requests

```python
import requests

# Login
login_response = requests.post(
    'http://localhost:3000/api/v1/auth/login',
    json={
        'email': 'admin@arsenal.com',
        'password': 'admin123'
    }
)
token = login_response.json()['data']['accessToken']

# Get alerts
alerts_response = requests.get(
    'http://localhost:3000/api/v1/alerts',
    headers={'Authorization': f'Bearer {token}'}
)
alerts = alerts_response.json()
```

## 🔄 Real-time Features (Socket.IO)

Selain REST API, backend juga menyediakan real-time updates via Socket.IO.

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
  console.log('Ticket assigned:', data);
});
```

## 📝 Rate Limiting

API dibatasi **100 requests per 15 menit** per IP address.

Response headers akan menunjukkan rate limit info:
```
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 95
X-RateLimit-Reset: 1234567890
```

## 🐛 Troubleshooting

### 401 Unauthorized
- Pastikan token valid dan belum expired
- Gunakan format: `Bearer <token>`
- Refresh token jika expired

### 403 Forbidden
- User tidak memiliki permission untuk endpoint tersebut
- Check role requirements di dokumentasi

### 404 Not Found
- Pastikan endpoint URL benar
- Check API version (default: v1)

### 500 Internal Server Error
- Check server logs
- Hubungi tim backend jika masalah persists

## 📞 Support

Untuk pertanyaan atau issue terkait API:
- Email: support@arsenal.com
- Slack: #arsenal-backend
- GitHub Issues: https://github.com/arsenal/backend/issues

## 📄 OpenAPI Specification

OpenAPI 3.0 specification tersedia di:
- JSON: http://localhost:3000/api-docs.json
- YAML: Export dari Swagger UI

Specification bisa digunakan untuk:
- Generate client libraries (berbagai bahasa)
- Import ke Postman/Insomnia
- API testing tools
- Code generation

## 🔄 Changelog

### Version 1.0.0 (2024-01-01)
- Initial release
- Authentication endpoints
- Alert management
- Ticketing system
- Notification system
- Real-time Socket.IO support
