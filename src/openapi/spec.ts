import { LeadSource, LeadStatus, Role, ServiceInterest } from '../generated/prisma/enums.js';

const enumValues = <T extends Record<string, string>>(values: T) => Object.values(values);

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
    },
    {
      name: 'Public Leads',
      description: 'Public lead capture endpoints for unauthenticated website forms.'
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
    },
    '/api/v1/leads/public': {
      post: {
        tags: ['Public Leads'],
        summary: 'Capture a public website lead',
        operationId: 'createPublicLead',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateLeadRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Lead captured successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeadResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid lead payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
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
        enum: enumValues(Role),
        example: Role.CLIENT
      },
      LeadStatus: {
        type: 'string',
        enum: enumValues(LeadStatus),
        example: LeadStatus.NEW
      },
      LeadSource: {
        type: 'string',
        enum: enumValues(LeadSource),
        example: LeadSource.CONTACT_FORM
      },
      ServiceInterest: {
        type: 'string',
        enum: enumValues(ServiceInterest),
        example: ServiceInterest.WEB_DEVELOPMENT
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
      Session: {
        type: 'object',
        required: ['id', 'expiresAt', 'token', 'createdAt', 'updatedAt', 'userId'],
        properties: {
          id: {
            type: 'string',
            example: 'clx0000000000000000000001'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-06T06:30:00.000Z'
          },
          token: {
            type: 'string',
            example: 'session-token'
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
          },
          ipAddress: {
            type: 'string',
            nullable: true,
            example: '127.0.0.1'
          },
          userAgent: {
            type: 'string',
            nullable: true,
            example: 'Mozilla/5.0'
          },
          userId: {
            type: 'string',
            example: 'clx0000000000000000000000'
          }
        }
      },
      Account: {
        type: 'object',
        required: ['id', 'accountId', 'providerId', 'userId', 'createdAt', 'updatedAt'],
        properties: {
          id: {
            type: 'string',
            example: 'clx0000000000000000000002'
          },
          accountId: {
            type: 'string',
            example: 'akshay@example.com'
          },
          providerId: {
            type: 'string',
            example: 'credential'
          },
          userId: {
            type: 'string',
            example: 'clx0000000000000000000000'
          },
          accessToken: {
            type: 'string',
            nullable: true
          },
          refreshToken: {
            type: 'string',
            nullable: true
          },
          idToken: {
            type: 'string',
            nullable: true
          },
          accessTokenExpiresAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2026-07-06T06:30:00.000Z'
          },
          refreshTokenExpiresAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2026-07-06T06:30:00.000Z'
          },
          scope: {
            type: 'string',
            nullable: true,
            example: 'openid email profile'
          },
          password: {
            type: 'string',
            nullable: true,
            writeOnly: true
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
      Verification: {
        type: 'object',
        required: ['id', 'identifier', 'value', 'expiresAt', 'createdAt', 'updatedAt'],
        properties: {
          id: {
            type: 'string',
            example: 'clx0000000000000000000003'
          },
          identifier: {
            type: 'string',
            example: 'akshay@example.com'
          },
          value: {
            type: 'string',
            example: 'verification-token'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-06-29T06:45:00.000Z'
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
      Lead: {
        type: 'object',
        required: [
          'id',
          'name',
          'email',
          'serviceInterest',
          'status',
          'source',
          'createdAt',
          'updatedAt'
        ],
        properties: {
          id: {
            type: 'string',
            example: 'clx0000000000000000000004'
          },
          name: {
            type: 'string',
            example: 'Akshay Kumar'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'akshay@example.com'
          },
          companyName: {
            type: 'string',
            nullable: true,
            example: 'Fanatic Coders'
          },
          serviceInterest: {
            $ref: '#/components/schemas/ServiceInterest'
          },
          budgetRange: {
            type: 'string',
            nullable: true,
            example: 'AED 10,000 - AED 25,000'
          },
          status: {
            $ref: '#/components/schemas/LeadStatus'
          },
          source: {
            $ref: '#/components/schemas/LeadSource'
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
      CreateLeadRequest: {
        type: 'object',
        required: ['name', 'email', 'serviceInterest'],
        properties: {
          name: {
            type: 'string',
            minLength: 2,
            maxLength: 255,
            example: 'Akshay Kumar'
          },
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            example: 'akshay@example.com'
          },
          companyName: {
            type: 'string',
            nullable: true,
            minLength: 1,
            maxLength: 255,
            example: 'Fanatic Coders'
          },
          serviceInterest: {
            $ref: '#/components/schemas/ServiceInterest'
          },
          budgetRange: {
            type: 'string',
            nullable: true,
            minLength: 1,
            maxLength: 255,
            example: 'AED 10,000 - AED 25,000'
          }
        }
      },
      LeadResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                $ref: '#/components/schemas/Lead'
              }
            }
          }
        ]
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
