import swaggerJsdoc from 'swagger-jsdoc';
import { swaggerPaths } from './swagger.paths';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'ARSeNAL Backend API',
      version: '1.0.0',
      description: `
# ARSeNAL Backend Integration API & Alert Ticketing System

Backend API untuk Smart Energy & Site Optimization System yang mengelola:
- **Alert Management**: Deteksi dan manajemen anomali konsumsi energi
- **Ticketing System**: Sistem tiket otomatis untuk penanganan alert
- **Real-time Notifications**: Notifikasi real-time via Socket.IO dan email
- **Data Integration**: Integrasi dengan berbagai sumber data (AMR, PLN, NMS, ISR)
- **Authentication & Authorization**: Sistem autentikasi berbasis JWT dengan role-based access control

## Authentication

API menggunakan JWT (JSON Web Token) untuk autentikasi. Untuk mengakses endpoint yang dilindungi:

1. Login melalui \`/api/v1/auth/login\` untuk mendapatkan access token
2. Gunakan token di header: \`Authorization: Bearer <token>\`
3. Token akan expired setelah 7 hari (default)

## User Roles

- **ADMIN**: Full access ke semua fitur
- **MANAGER**: View semua data, manage tickets
- **ANALYST**: View & analyze data, create alerts
- **OPS**: Handle alerts & tickets
- **VIEWER**: Read-only access

## Rate Limiting

API dibatasi 100 requests per 15 menit per IP address.

## Error Responses

Semua error menggunakan format standar:
\`\`\`json
{
  "success": false,
  "message": "Error message",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
\`\`\`
      `,
      contact: {
        name: 'ARSeNAL Team',
        email: 'support@arsenal.com',
      },
      license: {
        name: 'MIT',
        url: 'https://opensource.org/licenses/MIT',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000',
        description: 'Development server',
      },
      {
        url: 'https://api.arsenal.com',
        description: 'Production server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
          description: 'Enter JWT token obtained from /auth/login endpoint',
        },
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            email: { type: 'string', format: 'email' },
            name: { type: 'string' },
            role: {
              type: 'string',
              enum: ['ADMIN', 'MANAGER', 'ANALYST', 'OPS', 'VIEWER'],
            },
            isActive: { type: 'boolean' },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        Alert: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            type: {
              type: 'string',
              enum: ['ANOMALY', 'THRESHOLD', 'SYSTEM', 'MANUAL'],
            },
            severity: {
              type: 'string',
              enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            },
            status: {
              type: 'string',
              enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED'],
            },
            title: { type: 'string' },
            description: { type: 'string' },
            siteId: { type: 'string' },
            detectedAt: { type: 'string', format: 'date-time' },
            acknowledgedAt: { type: 'string', format: 'date-time' },
            resolvedAt: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Ticket: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            ticketNumber: { type: 'string' },
            title: { type: 'string' },
            description: { type: 'string' },
            priority: {
              type: 'string',
              enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
            },
            status: {
              type: 'string',
              enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
            },
            category: { type: 'string' },
            alertId: { type: 'string', format: 'uuid' },
            assignedToId: { type: 'string', format: 'uuid' },
            slaDeadline: { type: 'string', format: 'date-time' },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Site: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            siteId: { type: 'string' },
            siteName: { type: 'string' },
            region: { type: 'string' },
            latitude: { type: 'number', format: 'double' },
            longitude: { type: 'number', format: 'double' },
            capacity: { type: 'number' },
            tier: {
              type: 'string',
              enum: ['PLATINUM', 'GOLD', 'SILVER', 'BRONZE'],
            },
            topology: { type: 'string' },
            isActive: { type: 'boolean' },
          },
        },
        Notification: {
          type: 'object',
          properties: {
            id: { type: 'string', format: 'uuid' },
            userId: { type: 'string', format: 'uuid' },
            type: {
              type: 'string',
              enum: ['ALERT', 'TICKET', 'SYSTEM', 'INFO'],
            },
            title: { type: 'string' },
            message: { type: 'string' },
            status: {
              type: 'string',
              enum: ['UNREAD', 'READ'],
            },
            createdAt: { type: 'string', format: 'date-time' },
          },
        },
        Error: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        SuccessResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'object' },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
        PaginatedResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'array', items: {} },
            pagination: {
              type: 'object',
              properties: {
                page: { type: 'number' },
                limit: { type: 'number' },
                total: { type: 'number' },
                totalPages: { type: 'number' },
              },
            },
            timestamp: { type: 'string', format: 'date-time' },
          },
        },
      },
      responses: {
        Unauthorized: {
          description: 'Unauthorized - Invalid or missing token',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'No token provided',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        Forbidden: {
          description: 'Forbidden - Insufficient permissions',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Insufficient permissions',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        NotFound: {
          description: 'Resource not found',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Resource not found',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        BadRequest: {
          description: 'Bad Request - Validation error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Validation failed',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
        InternalServerError: {
          description: 'Internal Server Error',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/Error' },
              example: {
                success: false,
                message: 'Internal server error',
                timestamp: '2024-01-01T00:00:00.000Z',
              },
            },
          },
        },
      },
    },
    tags: [
      {
        name: 'Authentication',
        description: 'User authentication and authorization endpoints',
      },
      {
        name: 'Alerts',
        description: 'Alert management endpoints',
      },
      {
        name: 'Tickets',
        description: 'Ticketing system endpoints',
      },
      {
        name: 'Sites',
        description: 'Site management endpoints',
      },
      {
        name: 'Power Usage',
        description: 'Power usage and billing data endpoints',
      },
      {
        name: 'Notifications',
        description: 'User notification endpoints',
      },
    ],
    paths: swaggerPaths,
  },
  apis: [],
};

export const swaggerSpec = swaggerJsdoc(options);
