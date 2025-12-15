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
  '/api/v1/dashboard/summary': {
    get: {
      tags: ['Dashboard'],
      summary: 'Get dashboard summary statistics',
      description: 'Returns energy efficiency, problematic sites count, and backup status for the executive dashboard',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Dashboard summary data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      energyEfficiency: {
                        type: 'object',
                        properties: {
                          value: { type: 'number', example: 87.5 },
                          trend: { type: 'string', example: '+2.3%' },
                        },
                      },
                      problematicSites: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 12 },
                          high: { type: 'integer', example: 3 },
                          medium: { type: 'integer', example: 9 },
                        },
                      },
                      backupStatus: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 96 },
                          healthy: { type: 'integer', example: 89 },
                          atRisk: { type: 'integer', example: 7 },
                          reliability: { type: 'number', example: 92.7 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/dashboard/consumption': {
    get: {
      tags: ['Dashboard'],
      summary: 'Get consumption data for chart',
      description: 'Returns consumption data with bar chart (by region), line chart (by month), and summary statistics',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'period',
          schema: { type: 'integer', default: 6 },
          description: 'Number of months to fetch (1, 3, or 6)',
        },
        {
          in: 'query',
          name: 'siteId',
          schema: { type: 'string' },
          description: 'Filter by site ID (partial match)',
        },
        {
          in: 'query',
          name: 'region',
          schema: { type: 'string' },
          description: 'Filter by region name',
        },
      ],
      responses: {
        '200': {
          description: 'Consumption chart data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      labels: { type: 'array', items: { type: 'string' } },
                      datasets: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            label: { type: 'string' },
                            data: { type: 'array', items: { type: 'number' } },
                          },
                        },
                      },
                      summary: {
                        type: 'object',
                        properties: {
                          avgConsumption: { type: 'number', example: 8350000 },
                          avgBilling: { type: 'number', example: 9030000000 },
                          totalConsumption: { type: 'number', example: 50100000 },
                          totalBilling: { type: 'number', example: 54180000000 },
                        },
                      },
                      barChartData: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            region: { type: 'string', example: 'Jakarta' },
                            tagihan: { type: 'number', example: 50 },
                            konsumsi: { type: 'number', example: 70 },
                          },
                        },
                      },
                      lineChartData: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: { type: 'string', example: 'Jan' },
                            tagihan: { type: 'number', example: 1800 },
                            konsumsi: { type: 'number', example: 2500000 },
                          },
                        },
                      },
                      regions: { type: 'array', items: { type: 'string' }, example: ['Jakarta', 'Bandung', 'Surabaya'] },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/dashboard/heatmap': {
    get: {
      tags: ['Dashboard'],
      summary: 'Get heatmap data for sites',
      description: 'Returns full site data with coordinates for heatmap visualization including efficiency, consumption, and cost',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Heatmap data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: 'SITE-001-JAKARTA' },
                            name: { type: 'string', example: 'Jakarta Central' },
                            city: { type: 'string', example: 'Jakarta' },
                            region: { type: 'string', example: 'DKI Jakarta' },
                            type: { type: 'string', example: 'NON-AMR' },
                            cluster: { type: 'string', example: 'High Consumption' },
                            efficiency: { type: 'string', example: 'Medium 72%' },
                            ISR: { type: 'string', example: '001-2025-J' },
                            consumption: { type: 'string', example: '3150 kWh' },
                            cost: { type: 'string', example: 'Rp4.725.000' },
                            coordinates: { type: 'array', items: { type: 'number' }, example: [106.8456, -6.2088] },
                            status: { type: 'string', enum: ['critical', 'high', 'medium', 'low', 'efficient'], example: 'critical' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/dashboard/ticket-status': {
    get: {
      tags: ['Dashboard'],
      summary: 'Get ticket status distribution',
      description: 'Returns ticket count grouped by priority for pie chart visualization',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Ticket status distribution',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            name: { type: 'string', example: 'Critical' },
                            value: { type: 'integer', example: 3 },
                            color: { type: 'string', example: '#EF4444' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/dashboard/anomalies': {
    get: {
      tags: ['Dashboard'],
      summary: 'Get recent anomalies',
      description: 'Returns list of recent anomalies for the dashboard table',
      security: [{ bearerAuth: [] }],
      parameters: [
        {
          in: 'query',
          name: 'limit',
          schema: { type: 'integer', default: 10 },
          description: 'Number of anomalies to return',
        },
      ],
      responses: {
        '200': {
          description: 'List of recent anomalies',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', format: 'uuid' },
                            site: { type: 'string', example: 'Site-001-Jakarta' },
                            type: { type: 'string', example: 'High Consumption' },
                            severity: { type: 'string', enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO'] },
                            detail: { type: 'string', example: '165% above normal' },
                            time: { type: 'string', example: '2 hours ago' },
                            status: { type: 'string', example: 'Active' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/sites': {
    get: {
      tags: ['Sites'],
      summary: 'Get sites with filtering and pagination',
      description: 'Returns paginated list of sites with optional filtering by search, region, cluster, and period',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by site ID or name' },
        { in: 'query', name: 'region', schema: { type: 'string' }, description: 'Filter by region' },
        { in: 'query', name: 'cluster', schema: { type: 'string' }, description: 'Filter by cluster (High Consumption, Efficient)' },
        { in: 'query', name: 'period', schema: { type: 'string', enum: ['monthly', 'quarterly', 'yearly'] }, description: 'Period filter' },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Page number' },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 }, description: 'Items per page' },
      ],
      responses: {
        '200': {
          description: 'Paginated list of sites',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: '1' },
                            siteId: { type: 'string', example: 'SITE-001-JKT' },
                            region: { type: 'string', example: 'Jakarta' },
                            type: { type: 'string', enum: ['AMR', 'NON-AMR'], example: 'AMR' },
                            consumption: { type: 'number', example: 4606 },
                            monthlyBill: { type: 'number', example: 9000000 },
                            anomalyStatus: { type: 'string', enum: ['Normal', 'Medium', 'High', 'Critical'], example: 'Normal' },
                            cluster: { type: 'string', example: 'High Consumption' },
                            efficiency: { type: 'number', example: 76.1 },
                            costPerKwh: { type: 'number', example: 1864 },
                            deviation: { type: 'number', example: 12 },
                            lastUpdated: { type: 'string', example: '2025-10-15' },
                          },
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 40000 },
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 10 },
                          totalPages: { type: 'integer', example: 4000 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/sites/regions': {
    get: {
      tags: ['Sites'],
      summary: 'Get available regions',
      description: 'Returns list of available regions for filtering',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of regions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { type: 'string' }, example: ['Jakarta', 'Bandung', 'Surabaya'] },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/sites/{siteId}/detail': {
    get: {
      tags: ['Sites'],
      summary: 'Get site detail',
      description: 'Returns detailed information about a specific site including profile, technical specs, clusters, and predictions',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'siteId', required: true, schema: { type: 'string' }, description: 'Site ID' },
      ],
      responses: {
        '200': {
          description: 'Site detail data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      profile: {
                        type: 'object',
                        properties: {
                          siteId: { type: 'string', example: 'SITE-001-JKT' },
                          type: { type: 'string', enum: ['AMR', 'NON-AMR'] },
                          cluster: { type: 'string', example: 'High Consumption' },
                          efficiency: { type: 'number', example: 76.1 },
                          costPerKwh: { type: 'number', example: 1864 },
                          monthlyConsumption: { type: 'number', example: 4606 },
                          monthlyBill: { type: 'number', example: 9000000 },
                          clusterAverage: { type: 'number', example: 8100000 },
                          deviation: { type: 'number', example: 12 },
                          anomalyStatus: { type: 'string', enum: ['Normal', 'Medium', 'High', 'Critical'] },
                        },
                      },
                      technicalProfile: {
                        type: 'object',
                        properties: {
                          rectifierCapacity: { type: 'string', example: '48V/200A' },
                          acUnits: { type: 'string', example: '2 x 2PK' },
                          topology: { type: 'string', example: 'Indoor' },
                          generatorCapacity: { type: 'string', example: '15 kVA' },
                          height: { type: 'string', example: '25m' },
                          climateZone: { type: 'string', example: 'Tropical' },
                          location: { type: 'string', example: 'Jakarta' },
                          plnTariff: { type: 'string', example: 'B2/TR' },
                        },
                      },
                      clusters: { type: 'array', items: { type: 'object' } },
                      nextMonthEstimate: { type: 'object' },
                      predictionStats: { type: 'object' },
                      consumptionPrediction: { type: 'object' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { description: 'Site not found' },
      },
    },
  },
  '/api/v1/power-usage/{siteId}': {
    get: {
      tags: ['Power Usage'],
      summary: 'Get site power usage history',
      description: 'Returns power usage history for charts (cost and consumption prediction vs actual)',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'siteId', required: true, schema: { type: 'string' }, description: 'Site ID' },
        { in: 'query', name: 'period', schema: { type: 'integer', default: 6 }, description: 'Number of months' },
      ],
      responses: {
        '200': {
          description: 'Power usage chart data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      costChart: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: { type: 'string', example: 'Jan' },
                            predicted: { type: 'number', example: 28000 },
                            actual: { type: 'number', example: 30000 },
                          },
                        },
                      },
                      consumptionChart: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            month: { type: 'string', example: 'Jan' },
                            predicted: { type: 'number', example: 18000 },
                            actual: { type: 'number', example: 19500 },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/anomalies/summary': {
    get: {
      tags: ['Anomalies'],
      summary: 'Get anomaly summary counts',
      description: 'Returns count of anomalies grouped by severity (critical, high, medium)',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Anomaly summary counts',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      critical: { type: 'integer', example: 23 },
                      high: { type: 'integer', example: 67 },
                      medium: { type: 'integer', example: 66 },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/anomalies': {
    get: {
      tags: ['Anomalies'],
      summary: 'Get anomaly list',
      description: 'Returns paginated list of anomalies with optional filtering by severity and siteId',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'severity', schema: { type: 'string' }, description: 'Filter by severity (comma-separated: critical,high,medium)' },
        { in: 'query', name: 'siteId', schema: { type: 'string' }, description: 'Filter by site ID' },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Page number' },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 }, description: 'Items per page' },
      ],
      responses: {
        '200': {
          description: 'Paginated list of anomalies',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            id: { type: 'string', example: '1' },
                            siteId: { type: 'string', example: 'SITE-012-JKT' },
                            severity: { type: 'string', enum: ['Critical', 'High', 'Medium'], example: 'Critical' },
                            type: { type: 'string', example: 'Consumption Spike' },
                            deviation: { type: 'string', example: '+28.5%' },
                            estimatedCost: { type: 'number', example: 4200000 },
                            status: { type: 'string', example: 'Perlu Tindakan' },
                            timestamp: { type: 'string', example: '2 hours ago' },
                          },
                        },
                      },
                      pagination: {
                        type: 'object',
                        properties: {
                          total: { type: 'integer', example: 156 },
                          page: { type: 'integer', example: 1 },
                          limit: { type: 'integer', example: 10 },
                          totalPages: { type: 'integer', example: 16 },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/settlements': {
    get: {
      tags: ['Settlements'],
      summary: 'Get settlements with filtering and pagination',
      description: 'Returns paginated list of settlements with optional filtering by search, region, and condition',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by site ID' },
        { in: 'query', name: 'region', schema: { type: 'string' }, description: 'Filter by region' },
        { in: 'query', name: 'condition', schema: { type: 'string', enum: ['mismatch', 'frequency', 'capacity', 'normal'] }, description: 'Filter by condition type' },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Page number' },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 }, description: 'Items per page' },
      ],
      responses: {
        '200': {
          description: 'Paginated list of settlements',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string' },
                        siteId: { type: 'string', example: 'SITE-001-JKT' },
                        region: { type: 'string', example: 'Jakarta' },
                        isr: { type: 'string', example: 'ISR-67537402-0 005' },
                        status: { type: 'string', enum: ['Active', 'Inactive'] },
                        statusDays: { type: 'string', example: '43 hari' },
                        fsrValue: { type: 'number', example: 19.20 },
                        nmsValue: { type: 'number', example: 19.20 },
                        licensedCapacity: { type: 'string', example: '12 kWh' },
                        actualCapacity: { type: 'string', example: '12 kWh' },
                        condition: { type: 'string', example: 'Site Status Mismatch' },
                        conditionType: { type: 'string', enum: ['mismatch', 'frequency', 'capacity', 'normal'] },
                        isActive: { type: 'boolean' },
                      },
                    },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer', example: 40000 },
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 10 },
                      totalPages: { type: 'integer', example: 4000 },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/settlements/summary': {
    get: {
      tags: ['Settlements'],
      summary: 'Get settlement summary counts',
      description: 'Returns count of settlements grouped by condition type (mismatch types)',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'Settlement summary counts',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      siteMismatch: { type: 'integer', example: 8 },
                      frequencyMismatch: { type: 'integer', example: 7 },
                      capacityMismatch: { type: 'integer', example: 12 },
                      total: { type: 'integer', example: 27 },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/settlements/regions': {
    get: {
      tags: ['Settlements'],
      summary: 'Get available regions',
      description: 'Returns list of available regions for filtering',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of regions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { type: 'string' }, example: ['Jakarta', 'Bandung', 'Surabaya'] },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/settlements/{siteId}': {
    get: {
      tags: ['Settlements'],
      summary: 'Get settlement detail',
      description: 'Returns detailed settlement information for a specific site including ISR, NMS, network, device, and NDM data',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'siteId', required: true, schema: { type: 'string' }, description: 'Site ID' },
      ],
      responses: {
        '200': {
          description: 'Settlement detail data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      id: { type: 'string' },
                      siteId: { type: 'string' },
                      isrData: { type: 'object' },
                      nmsData: { type: 'object' },
                      networkData: { type: 'object' },
                      deviceData: { type: 'object' },
                      ndmData: { type: 'object' },
                      condition: { type: 'string' },
                      conditionType: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { description: 'Settlement not found' },
      },
    },
  },
  '/api/v1/settlements/{siteId}/work-orders': {
    get: {
      tags: ['Settlements'],
      summary: 'Get work orders for a site',
      description: 'Returns list of historical work orders for a specific site',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'siteId', required: true, schema: { type: 'string' }, description: 'Site ID' },
      ],
      responses: {
        '200': {
          description: 'List of work orders',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: {
                        type: 'array',
                        items: {
                          type: 'object',
                          properties: {
                            no: { type: 'integer', example: 1 },
                            orderNum: { type: 'string', example: 'WO-1092' },
                            desc: { type: 'string', example: 'Maintenance Kabel' },
                            technician: { type: 'string', example: 'Budi' },
                            date: { type: 'string', example: '12 Sep 2025' },
                          },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/power-backup': {
    get: {
      tags: ['Power Backup'],
      summary: 'Get power backup sites with filtering and pagination',
      description: 'Returns paginated list of power backup sites with optional filtering by search, region, and tier',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'query', name: 'search', schema: { type: 'string' }, description: 'Search by site ID' },
        { in: 'query', name: 'region', schema: { type: 'string' }, description: 'Filter by region' },
        { in: 'query', name: 'tier', schema: { type: 'string', enum: ['Platinum', 'Gold', 'Silver', 'Bronze'] }, description: 'Filter by tier' },
        { in: 'query', name: 'page', schema: { type: 'integer', default: 1 }, description: 'Page number' },
        { in: 'query', name: 'limit', schema: { type: 'integer', default: 10 }, description: 'Items per page' },
      ],
      responses: {
        '200': {
          description: 'Paginated list of power backup sites',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'array',
                    items: {
                      type: 'object',
                      properties: {
                        id: { type: 'string', example: 'SITE-001-JKT' },
                        siteId: { type: 'string', example: 'SITE-001-JKT' },
                        region: { type: 'string', example: 'Jakarta' },
                        tier: { type: 'string', enum: ['Platinum', 'Gold', 'Silver', 'Bronze'] },
                        capacity: { type: 'string', example: '10 kWh / 3h' },
                        lastOutage: { type: 'string', example: '5h ago' },
                        duration: { type: 'string', example: '2.5h' },
                        alarmCount: { type: 'integer', example: 7 },
                        risk: { type: 'string', enum: ['Critical', 'High', 'Medium', 'Normal'] },
                        position: { type: 'array', items: { type: 'number' }, example: [-6.2088, 106.8456] },
                        downtimeRisk: { type: 'string', example: 'Normal' },
                        backupCapacity: { type: 'string', example: '9.9h' },
                        batteryStatus: { type: 'string', example: 'Online' },
                        warranty: { type: 'string', example: 'Level 2' },
                      },
                    },
                  },
                  pagination: {
                    type: 'object',
                    properties: {
                      total: { type: 'integer', example: 40000 },
                      page: { type: 'integer', example: 1 },
                      limit: { type: 'integer', example: 10 },
                      totalPages: { type: 'integer', example: 4000 },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/power-backup/regions': {
    get: {
      tags: ['Power Backup'],
      summary: 'Get available regions',
      description: 'Returns list of available regions for filtering',
      security: [{ bearerAuth: [] }],
      responses: {
        '200': {
          description: 'List of regions',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      data: { type: 'array', items: { type: 'string' }, example: ['Jakarta', 'Bandung', 'Surabaya'] },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/power-backup/{siteId}': {
    get: {
      tags: ['Power Backup'],
      summary: 'Get power backup site detail',
      description: 'Returns detailed power backup information for a specific site',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'siteId', required: true, schema: { type: 'string' }, description: 'Site ID' },
      ],
      responses: {
        '200': {
          description: 'Power backup site detail',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: { type: 'object' },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
        '404': { description: 'Site not found' },
      },
    },
  },
  '/api/v1/power-backup/{siteId}/power-analysis': {
    get: {
      tags: ['Power Backup'],
      summary: 'Get power analysis data',
      description: 'Returns hourly power consumption and backup analysis data for a site',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'siteId', required: true, schema: { type: 'string' }, description: 'Site ID' },
      ],
      responses: {
        '200': {
          description: 'Power analysis data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      hourlyData: { type: 'array', items: { type: 'object' } },
                      avgConsumption: { type: 'string', example: '55.6 kWh' },
                      backupCapacity: { type: 'string', example: '9.9h' },
                      predictedNeed: { type: 'string', example: '7.5h' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/power-backup/{siteId}/outage-history': {
    get: {
      tags: ['Power Backup'],
      summary: 'Get outage history',
      description: 'Returns 12-month outage history for a site',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'siteId', required: true, schema: { type: 'string' }, description: 'Site ID' },
      ],
      responses: {
        '200': {
          description: 'Outage history data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      monthlyData: { type: 'array', items: { type: 'object' } },
                      monthlyAverage: { type: 'integer', example: 5 },
                      avgTime: { type: 'string', example: '1.5h' },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
  '/api/v1/power-backup/{siteId}/battery-health': {
    get: {
      tags: ['Power Backup'],
      summary: 'Get battery health trend',
      description: 'Returns 30-day battery health trend for a site',
      security: [{ bearerAuth: [] }],
      parameters: [
        { in: 'path', name: 'siteId', required: true, schema: { type: 'string' }, description: 'Site ID' },
      ],
      responses: {
        '200': {
          description: 'Battery health data',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  success: { type: 'boolean', example: true },
                  data: {
                    type: 'object',
                    properties: {
                      dailyData: { type: 'array', items: { type: 'object' } },
                      currentHealth: { type: 'string', example: '34%' },
                      avgTemperature: { type: 'string', example: '28.0°C' },
                      chargeCycles: { type: 'integer', example: 245 },
                    },
                  },
                },
              },
            },
          },
        },
        '401': { $ref: '#/components/responses/Unauthorized' },
      },
    },
  },
};
