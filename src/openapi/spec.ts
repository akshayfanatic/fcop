export const createOpenApiDocument = (baseUrl: string) => ({
  openapi: '3.0.3',
  info: {
    title: 'FCOP Backend API',
    version: '1.0.1',
    description: 'OpenAPI contract for FCOP backend application routes.'
  },
  servers: [
    {
      url: baseUrl,
      description: 'Configured backend URL'
    }
  ],
  tags: [
    {
      name: 'System',
      description: 'System health and metadata endpoints.'
    }
  ],
  paths: {
    '/api/health': {
      get: {
        tags: ['System'],
        summary: 'Health check',
        operationId: 'getHealth',
        responses: {
          '200': {
            description: 'Backend is running.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/HealthResponse'
                }
              }
            }
          }
        }
      }
    }
  },
  components: {
    schemas: {
      Role: {
        type: 'string',
        enum: ['ADMIN', 'CLIENT', 'MANAGER', 'MEMBER'],
        example: 'CLIENT'
      },
      ApiResponse: {
        type: 'object',
        required: ['success', 'status', 'message'],
        properties: {
          success: {
            type: 'boolean',
            example: true
          },
          status: {
            type: 'integer',
            example: 200
          },
          message: {
            type: 'string',
            example: 'Health check passed.'
          },
          data: {
            nullable: true
          },
          error: {
            type: 'object',
            required: ['code'],
            properties: {
              code: {
                type: 'string',
                example: 'NOT_FOUND'
              },
              details: {
                type: 'string'
              }
            }
          }
        }
      },
      User: {
        type: 'object',
        required: ['id', 'name', 'email', 'emailVerified', 'role', 'createdAt', 'updatedAt'],
        properties: {
          id: {
            type: 'string',
            example: 'clx0000000000000000000000'
          },
          name: {
            type: 'string',
            example: 'Akshay'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'akshay@example.com'
          },
          emailVerified: {
            type: 'boolean',
            example: true
          },
          image: {
            type: 'string',
            nullable: true,
            example: 'https://example.com/avatar.png'
          },
          role: {
            $ref: '#/components/schemas/Role'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-29T06:30:00.000Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-29T06:30:00.000Z'
          }
        }
      },
      HealthResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                $ref: '#/components/schemas/HealthData'
              }
            }
          }
        ]
      },
      HealthData: {
        type: 'object',
        required: ['status', 'uptime', 'timestamp'],
        properties: {
          status: {
            type: 'string',
            example: 'ok'
          },
          uptime: {
            type: 'number',
            example: 42.5
          },
          timestamp: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-29T06:30:00.000Z'
          }
        }
      }
    }
  }
});
