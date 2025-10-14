export const swaggerPaths = {
  '/api/v1/auth/login': {
    post: {
      tags: ['Authentication'],
      summary: 'Login user',
      description: 'Authenticate user and get access token',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'password'],
              properties: {
                email: {
                  type: 'string',
                  format: 'email',
                  example: 'admin@arsenal.com',
                },
                password: {
                  type: 'string',
                  format: 'password',
                  example: 'admin123',
                },
              },
            },
          },
        },
      },
      responses: {
        '200': {
          description: 'Login successful',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  message: { type: 'string', example: 'Login successful' },
                  data: {
                    type: 'object',
                    properties: {
                      user: { $ref: '#/components/schemas/User' },
                      accessToken: { type: 'string' },
                      refreshToken: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '500': { $ref: '#/components/responses/InternalServerError' },
      },
    },
  },
  '/api/v1/auth/register': {
    post: {
      tags: ['Authentication'],
      summary: 'Register new user',
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['email', 'name', 'password'],
              properties: {
                email: { type: 'string', format: 'email' },
                name: { type: 'string' },
                password: { type: 'string', minLength: 8 },
                role: {
                  type: 'string',
                  enum: ['ADMIN', 'MANAGER', 'ANALYST', 'OPS', 'VIEWER'],
                },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'User registered successfully',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
        '400': { $ref: '#/components/responses/BadRequest' },
      },
    },
  },
  '/api/v1/auth/profile': {
    get: {
      tags: ['Authentication'],
      summary: 'Get current user profile',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'User profile',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/User' },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/alerts': {
    get: {
      tags: ['Alerts'],
      summary: 'Get all alerts',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'type',
          schema: {
            type: 'string',
            enum: ['ANOMALY', 'THRESHOLD', 'SYSTEM', 'MANUAL'],
          },
        },
        {
          in: 'query',
          name: 'severity',
          schema: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
          },
        },
        {
          in: 'query',
          name: 'status',
          schema: {
            type: 'string',
            enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED'],
          },
        },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        '200': {
          description: 'List of alerts',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaginatedResponse' },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
    post: {
      tags: ['Alerts'],
      summary: 'Create new alert',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['type', 'severity', 'title', 'description'],
              properties: {
                type: {
                  type: 'string',
                  enum: ['ANOMALY', 'THRESHOLD', 'SYSTEM', 'MANUAL'],
                },
                severity: {
                  type: 'string',
                  enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                },
                title: { type: 'string' },
                description: { type: 'string' },
                siteId: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': {
          description: 'Alert created',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/SuccessResponse' },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/api/v1/alerts/{id}': {
    get: {
      tags: ['Alerts'],
      summary: 'Get alert by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Alert details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Alert' },
                },
              },
            },
          },
        },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
    patch: {
      tags: ['Alerts'],
      summary: 'Update alert',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['OPEN', 'ACKNOWLEDGED', 'RESOLVED', 'CLOSED'],
                },
                severity: {
                  type: 'string',
                  enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Alert updated' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
    delete: {
      tags: ['Alerts'],
      summary: 'Delete alert',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '204': { description: 'Alert deleted' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/api/v1/alerts/{id}/acknowledge': {
    post: {
      tags: ['Alerts'],
      summary: 'Acknowledge alert',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': { description: 'Alert acknowledged' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/api/v1/alerts/{id}/resolve': {
    post: {
      tags: ['Alerts'],
      summary: 'Resolve alert',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['resolution'],
              properties: {
                resolution: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Alert resolved' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/api/v1/tickets': {
    get: {
      tags: ['Tickets'],
      summary: 'Get all tickets',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'status',
          schema: {
            type: 'string',
            enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
          },
        },
        {
          in: 'query',
          name: 'priority',
          schema: {
            type: 'string',
            enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
          },
        },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        '200': {
          description: 'List of tickets',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaginatedResponse' },
            },
          },
        },
      },
    },
    post: {
      tags: ['Tickets'],
      summary: 'Create new ticket',
      security: [{ bearerAuth: [] }],
      requestBody: {
        required: true,
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['title', 'description', 'priority', 'alertId'],
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
                priority: {
                  type: 'string',
                  enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                },
                alertId: { type: 'string', format: 'uuid' },
                category: { type: 'string' },
              },
            },
          },
        },
      },
      responses: {
        '201': { description: 'Ticket created' },
        '403': { $ref: '#/components/responses/Forbidden' },
      },
    },
  },
  '/api/v1/tickets/{id}': {
    get: {
      tags: ['Tickets'],
      summary: 'Get ticket by ID',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      responses: {
        '200': {
          description: 'Ticket details',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean' },
                  data: { $ref: '#/components/schemas/Ticket' },
                },
              },
            },
          },
        },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
    patch: {
      tags: ['Tickets'],
      summary: 'Update ticket',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'path',
          name: 'id',
          required: true,
          schema: { type: 'string', format: 'uuid' },
        },
      ],
      requestBody: {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['OPEN', 'ASSIGNED', 'IN_PROGRESS', 'RESOLVED', 'CLOSED'],
                },
                priority: {
                  type: 'string',
                  enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW'],
                },
                assignedToId: { type: 'string', format: 'uuid' },
              },
            },
          },
        },
      },
      responses: {
        '200': { description: 'Ticket updated' },
        '403': { $ref: '#/components/responses/Forbidden' },
        '404': { $ref: '#/components/responses/NotFound' },
      },
    },
  },
  '/api/v1/notifications': {
    get: {
      tags: ['Notifications'],
      summary: 'Get user notifications',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'status',
          schema: { type: 'string', enum: ['UNREAD', 'READ'] },
        },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 } },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 20 } },
      ],
      responses: {
        '200': {
          description: 'List of notifications',
          content: {
            'application/json': {
              schema: { $ref: '#/components/schemas/PaginatedResponse' },
            },
          },
        },
      },
    },
  },
};
