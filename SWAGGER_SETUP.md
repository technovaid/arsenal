# Swagger API Documentation Setup

## ✅ Setup Completed

Swagger/OpenAPI documentation telah berhasil disetup untuk ARSeNAL Backend API.

## 🔗 Access URLs

### Development
- **Swagger UI**: http://localhost:3000/api-docs
- **OpenAPI JSON**: http://localhost:3000/api-docs.json

### Production
- **Swagger UI**: https://api.arsenal.com/api-docs
- **OpenAPI JSON**: https://api.arsenal.com/api-docs.json

## 📦 Installed Packages

```json
{
  "dependencies": {
    "swagger-ui-express": "^5.0.0",
    "swagger-jsdoc": "^6.2.8"
  },
  "devDependencies": {
    "@types/swagger-ui-express": "^4.1.6",
    "@types/swagger-jsdoc": "^6.0.4"
  }
}
```

## 📁 File Structure

```
backend/
├── src/
│   ├── config/
│   │   └── swagger.ts              # Swagger configuration
│   ├── routes/
│   │   ├── auth.routes.ts          # Auth endpoints
│   │   ├── auth.routes.swagger.ts  # Auth documentation
│   │   ├── alert.routes.swagger.ts # Alert documentation
│   │   ├── ticket.routes.swagger.ts # Ticket documentation
│   │   └── notification.routes.swagger.ts # Notification documentation
│   └── server.ts                   # Swagger integration
├── API_DOCUMENTATION.md            # Complete API guide
└── SWAGGER_SETUP.md               # This file
```

## 🎯 Features Documented

### ✅ Authentication Endpoints
- POST `/api/v1/auth/register` - Register new user
- POST `/api/v1/auth/login` - Login user
- POST `/api/v1/auth/refresh-token` - Refresh access token
- GET `/api/v1/auth/profile` - Get user profile
- POST `/api/v1/auth/change-password` - Change password

### ✅ Alert Endpoints
- GET `/api/v1/alerts` - Get all alerts (with filters)
- POST `/api/v1/alerts` - Create new alert
- GET `/api/v1/alerts/statistics` - Get alert statistics
- GET `/api/v1/alerts/:id` - Get alert by ID
- PATCH `/api/v1/alerts/:id` - Update alert
- DELETE `/api/v1/alerts/:id` - Delete alert
- POST `/api/v1/alerts/:id/acknowledge` - Acknowledge alert
- POST `/api/v1/alerts/:id/resolve` - Resolve alert

### ✅ Ticket Endpoints
- GET `/api/v1/tickets` - Get all tickets (with filters)
- POST `/api/v1/tickets` - Create new ticket
- GET `/api/v1/tickets/statistics` - Get ticket statistics
- GET `/api/v1/tickets/:id` - Get ticket by ID
- PATCH `/api/v1/tickets/:id` - Update ticket
- POST `/api/v1/tickets/:id/comments` - Add comment to ticket

### ✅ Notification Endpoints
- GET `/api/v1/notifications` - Get user notifications
- PATCH `/api/v1/notifications/:id/read` - Mark notification as read

## 🔐 Authentication in Swagger UI

### Step 1: Login
1. Buka Swagger UI: http://localhost:3000/api-docs
2. Scroll ke **Authentication** section
3. Klik endpoint `POST /api/v1/auth/login`
4. Klik **"Try it out"**
5. Masukkan credentials:
   ```json
   {
     "email": "admin@arsenal.com",
     "password": "admin123"
   }
   ```
6. Klik **"Execute"**
7. Copy `accessToken` dari response

### Step 2: Authorize
1. Klik tombol **"Authorize"** 🔒 di bagian atas Swagger UI
2. Masukkan: `Bearer <your-access-token>`
3. Klik **"Authorize"**
4. Klik **"Close"**

### Step 3: Test Protected Endpoints
Sekarang Anda bisa test semua protected endpoints dengan authentication yang sudah disetup.

## 📝 How to Add New Endpoint Documentation

### Method 1: JSDoc in Route File

```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Success
 */
router.get('/your-endpoint', controller.method);
```

### Method 2: Separate Swagger File

Create `src/routes/your-route.swagger.ts`:

```typescript
/**
 * @swagger
 * /api/v1/your-endpoint:
 *   get:
 *     summary: Your endpoint description
 *     tags: [YourTag]
 *     ...
 */
```

## 🎨 Swagger Configuration

File: `src/config/swagger.ts`

### Key Features:
- ✅ OpenAPI 3.0 specification
- ✅ JWT Bearer authentication
- ✅ Reusable schemas (User, Alert, Ticket, etc.)
- ✅ Common response schemas
- ✅ Error response templates
- ✅ Tags for endpoint grouping
- ✅ Detailed descriptions

### Schemas Defined:
- User
- Alert
- Ticket
- Site
- Notification
- Error
- SuccessResponse
- PaginatedResponse

## 🔄 Update Swagger Documentation

Setelah menambahkan dokumentasi baru:

1. **Development** (auto-reload):
   ```bash
   npm run dev
   ```

2. **Production** (rebuild):
   ```bash
   npm run build
   docker-compose restart backend
   ```

## 📤 Export OpenAPI Specification

### JSON Format
```bash
curl http://localhost:3000/api-docs.json > openapi.json
```

### Use in Other Tools

**Postman:**
1. Import → Link
2. Enter: `http://localhost:3000/api-docs.json`

**Insomnia:**
1. Import/Export → Import Data
2. From URL: `http://localhost:3000/api-docs.json`

**Code Generation:**
```bash
# Install OpenAPI Generator
npm install -g @openapitools/openapi-generator-cli

# Generate client (e.g., TypeScript)
openapi-generator-cli generate \
  -i http://localhost:3000/api-docs.json \
  -g typescript-axios \
  -o ./generated-client
```

## 🧪 Testing with Swagger UI

### Example: Create Alert

1. Navigate to **Alerts** section
2. Click `POST /api/v1/alerts`
3. Click **"Try it out"**
4. Fill request body:
   ```json
   {
     "type": "ANOMALY",
     "severity": "HIGH",
     "title": "Test Alert",
     "description": "This is a test alert",
     "siteId": "JKT-001"
   }
   ```
5. Click **"Execute"**
6. Check response

### Example: Get Alerts with Filters

1. Click `GET /api/v1/alerts`
2. Click **"Try it out"**
3. Set parameters:
   - severity: `HIGH`
   - status: `OPEN`
   - page: `1`
   - limit: `10`
4. Click **"Execute"**
5. View filtered results

## 📊 Benefits

✅ **Interactive Documentation** - Test endpoints directly from browser
✅ **Auto-generated** - Documentation from code annotations
✅ **Always Up-to-date** - Synced with code changes
✅ **Client Generation** - Generate client libraries automatically
✅ **Team Collaboration** - Shared understanding of API
✅ **API Testing** - Built-in testing interface
✅ **Standards Compliant** - OpenAPI 3.0 specification

## 🔧 Customization

### Change Theme/Style

Edit `src/server.ts`:

```typescript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: 'ARSeNAL API Documentation',
  customfavIcon: '/favicon.ico',
  swaggerOptions: {
    persistAuthorization: true, // Keep auth after refresh
  }
}));
```

### Add Custom Logo

```typescript
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec, {
  customCss: `
    .topbar-wrapper img { content: url('/logo.png'); }
    .swagger-ui .topbar { background-color: #1a1a1a; }
  `,
}));
```

## 📚 Additional Resources

- [Swagger UI Documentation](https://swagger.io/tools/swagger-ui/)
- [OpenAPI Specification](https://swagger.io/specification/)
- [swagger-jsdoc](https://github.com/Surnet/swagger-jsdoc)
- [Complete API Guide](./API_DOCUMENTATION.md)

## ✅ Checklist

- [x] Install swagger packages
- [x] Create swagger configuration
- [x] Integrate with Express server
- [x] Document Authentication endpoints
- [x] Document Alert endpoints
- [x] Document Ticket endpoints
- [x] Document Notification endpoints
- [x] Add JWT authentication support
- [x] Create API documentation guide
- [x] Test Swagger UI
- [x] Update README

## 🎉 Done!

Swagger documentation sudah siap digunakan. Akses di:
**http://localhost:3000/api-docs**
