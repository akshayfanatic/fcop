import { LeadSource, LeadStatus, ProjectCurrency, ProjectMemberRole, ProjectStatus, ProposalPaymentStatus, ProposalStatus, ServiceInterest, ServiceRequestStatus } from '../generated/prisma/enums.js';
import { Role } from '../lib/auth/permissions.js';
import { DEFAULT_PAGE, DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from '../utils/pagination.js';

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
      name: 'Auth',
      description: 'Authentication helper endpoints.'
    },
    {
      name: 'Invitations',
      description: 'Organization member invitation endpoints.'
    },
    {
      name: 'Leads',
      description: 'Lead management endpoints.'
    },
    {
      name: 'Service Requests',
      description: 'Client service request endpoints.'
    },
    {
      name: 'Proposals',
      description: 'Commercial proposals nested under service requests.'
    },
    {
      name: 'Projects',
      description: 'Project delivery management endpoints.'
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
    '/api/v1/auth/request-password-reset': {
      post: {
        tags: ['Auth'],
        summary: 'Request a password reset email',
        description: 'Triggers Better Auth password reset flow and sends the customer a reset email from the backend email service.',
        operationId: 'requestPasswordReset',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/RequestPasswordResetRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Request accepted. The response does not reveal whether the email exists.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/RequestPasswordResetResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid email or redirect URL.',
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
    },
    '/api/v1/me': {
      get: {
        tags: ['Auth'],
        summary: 'Fetch current user access',
        description: 'Returns the authenticated user, active organization member, role, and permission statements for UI access checks.',
        operationId: 'getMe',
        security: [
          {
            cookieAuth: []
          }
        ],
        responses: {
          '200': {
            description: 'Current user fetched successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/MeResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '404': {
            description: 'Authenticated user does not have an active organization member.',
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
    },
    '/api/v1/invitations': {
      post: {
        tags: ['Invitations'],
        summary: 'Invite an organization member',
        description: 'Creates a Better Auth organization invitation for the FCOP organization and sends an invitation email. Requires invitation:create permission in the active organization.',
        operationId: 'inviteMember',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          invitation: ['create']
        },
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/InviteMemberRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Invitation created and invitation email queued/sent.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/InvitationResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid invitation payload or Better Auth rejected the invitation.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'FCOP organization has not been bootstrapped.',
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
    },
    '/api/v1/leads': {
      post: {
        tags: ['Leads'],
        summary: 'Create a lead',
        description: 'Creates a lead from an unauthenticated website form submission.',
        operationId: 'createLead',
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
      },
      get: {
        tags: ['Leads'],
        summary: 'Fetch all leads',
        description: 'Requires lead:read permission in the active organization.',
        operationId: 'getLeads',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          lead: ['read']
        },
        parameters: [
          {
            name: 'email',
            in: 'query',
            description: 'Filter by full or partial lead email.',
            schema: {
              type: 'string',
              minLength: 1,
              maxLength: 255
            }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by lead status.',
            schema: {
              $ref: '#/components/schemas/LeadStatus'
            }
          },
          {
            name: 'serviceType',
            in: 'query',
            description: 'Filter by requested service type.',
            schema: {
              $ref: '#/components/schemas/ServiceInterest'
            }
          },
          {
            name: 'page',
            in: 'query',
            description: 'One-based page number.',
            schema: {
              type: 'integer',
              minimum: 1,
              default: DEFAULT_PAGE
            }
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Number of leads per page.',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: MAX_PAGE_SIZE,
              default: DEFAULT_PAGE_SIZE
            }
          }
        ],
        responses: {
          '200': {
            description: 'Leads fetched successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeadsResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '400': {
            description: 'Invalid lead filters.',
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
    },
    '/api/v1/leads/{id}': {
      get: {
        tags: ['Leads'],
        summary: 'Fetch a lead by id',
        description: 'Requires lead:read permission in the active organization.',
        operationId: 'getLeadById',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          lead: ['read']
        },
        parameters: [
          {
            $ref: '#/components/parameters/LeadId'
          }
        ],
        responses: {
          '200': {
            description: 'Lead fetched successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeadResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Lead was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Leads'],
        summary: 'Update a lead by id',
        description: 'Requires lead:update permission in the active organization.',
        operationId: 'updateLeadById',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          lead: ['update']
        },
        parameters: [
          {
            $ref: '#/components/parameters/LeadId'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateLeadRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Lead updated successfully.',
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
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Lead was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Leads'],
        summary: 'Delete a lead by id',
        description: 'Requires lead:delete permission in the active organization.',
        operationId: 'deleteLeadById',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          lead: ['delete']
        },
        parameters: [
          {
            $ref: '#/components/parameters/LeadId'
          }
        ],
        responses: {
          '200': {
            description: 'Lead deleted successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/LeadResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Lead was not found.',
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
    },
    '/api/v1/service-requests': {
      post: {
        tags: ['Service Requests'],
        summary: 'Create a service request',
        description: 'Creates a service request for the authenticated client.',
        operationId: 'createServiceRequest',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          serviceRequest: ['create']
        },
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateServiceRequestRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Service request created successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ServiceRequestResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid service request payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Client profile has not been created.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Service Requests'],
        summary: 'Fetch service requests',
        description: 'Requires serviceRequest:read permission in the active organization.',
        operationId: 'getServiceRequests',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          serviceRequest: ['read']
        },
        responses: {
          '200': {
            description: 'Service requests fetched successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ServiceRequestsResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          }
        }
      }
    },
    '/api/v1/service-requests/{serviceRequestId}/proposal': {
      post: {
        tags: ['Proposals'],
        summary: 'Create a proposal',
        description: 'Creates the single draft proposal for a service request. Available to Admin and Manager roles.',
        operationId: 'createServiceRequestProposal',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          proposal: ['create']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ServiceRequestProposalServiceRequestId'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateProposalRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Proposal created successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProposalResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid proposal payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Service request was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '409': {
            description: 'A proposal or project already exists for the service request.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Proposals'],
        summary: 'Fetch a proposal',
        description: 'Returns the proposal for a service request. Clients can access only their own service request.',
        operationId: 'getServiceRequestProposal',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          proposal: ['read']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ServiceRequestProposalServiceRequestId'
          }
        ],
        responses: {
          '200': {
            description: 'Proposal fetched successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProposalResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Service request or proposal was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      patch: {
        tags: ['Proposals'],
        summary: 'Update a proposal',
        description: 'Admin and Manager can change draft terms or set status to SENT. The owning Client can only set status to ACCEPTED. Accepted proposals are immutable.',
        operationId: 'updateServiceRequestProposal',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          proposal: ['update']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ServiceRequestProposalServiceRequestId'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateProposalRequest'
              },
              examples: {
                sendForReview: {
                  summary: 'Management sends the proposal',
                  value: {
                    status: ProposalStatus.SENT
                  }
                },
                accept: {
                  summary: 'Client accepts the proposal',
                  value: {
                    status: ProposalStatus.ACCEPTED
                  }
                }
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Proposal updated successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProposalResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid or empty proposal update.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            description: 'Role is not allowed to perform the requested proposal transition or field update.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '404': {
            description: 'Service request or proposal was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '409': {
            description: 'Proposal state does not allow the requested update.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Proposals'],
        summary: 'Delete a proposal',
        description: 'Deletes a draft or sent proposal. Accepted proposals are preserved as immutable records.',
        operationId: 'deleteServiceRequestProposal',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          proposal: ['delete']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ServiceRequestProposalServiceRequestId'
          }
        ],
        responses: {
          '200': {
            description: 'Proposal deleted successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProposalResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Service request or proposal was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '409': {
            description: 'Accepted proposal cannot be deleted.',
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
    },
    '/api/v1/service-requests/{serviceRequestId}/project': {
      post: {
        tags: ['Projects'],
        summary: 'Create project from service request',
        description: 'Creates a project using the client and service from an existing service request. Admin can assign a manager; Manager is assigned to self.',
        operationId: 'createProjectFromServiceRequest',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          serviceRequest: ['read', 'update'],
          project: ['create']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ServiceRequestProjectServiceRequestId'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateProjectFromServiceRequestRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Project created from service request successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProjectResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid project payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Service request was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '409': {
            description: 'A project already exists for this service request.',
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
    },
    '/api/v1/projects': {
      post: {
        tags: ['Projects'],
        summary: 'Create a project',
        description: 'Creates a project directly. Admin can assign a manager; Manager is assigned to self.',
        operationId: 'createProject',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          project: ['create']
        },
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/CreateProjectRequest'
              }
            }
          }
        },
        responses: {
          '201': {
            description: 'Project created successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProjectResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid project payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Client or service request was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      get: {
        tags: ['Projects'],
        summary: 'Fetch projects',
        description: 'Admin sees all projects; clients see own projects; other members see assigned or created projects.',
        operationId: 'getProjects',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          project: ['read']
        },
        parameters: [
          {
            name: 'name',
            in: 'query',
            description: 'Filter by full or partial project name.',
            schema: {
              type: 'string',
              minLength: 1,
              maxLength: 255
            }
          },
          {
            name: 'status',
            in: 'query',
            description: 'Filter by project status.',
            schema: {
              $ref: '#/components/schemas/ProjectStatus'
            }
          },
          {
            name: 'serviceType',
            in: 'query',
            description: 'Filter by project service type.',
            schema: {
              $ref: '#/components/schemas/ServiceInterest'
            }
          },
          {
            name: 'page',
            in: 'query',
            description: 'One-based page number.',
            schema: {
              type: 'integer',
              minimum: 1,
              default: DEFAULT_PAGE
            }
          },
          {
            name: 'pageSize',
            in: 'query',
            description: 'Number of projects per page.',
            schema: {
              type: 'integer',
              minimum: 1,
              maximum: MAX_PAGE_SIZE,
              default: DEFAULT_PAGE_SIZE
            }
          }
        ],
        responses: {
          '200': {
            description: 'Projects fetched successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProjectsResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '400': {
            description: 'Invalid project filters.',
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
    },
    '/api/v1/projects/{id}': {
      get: {
        tags: ['Projects'],
        summary: 'Fetch a project by id',
        operationId: 'getProjectById',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          project: ['read']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ProjectId'
          }
        ],
        responses: {
          '200': {
            description: 'Project fetched successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProjectResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Project was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Projects'],
        summary: 'Update a project by id',
        description: 'Updates project details. Admin can reassign manager; Manager stays assigned to self.',
        operationId: 'updateProjectById',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          project: ['update']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ProjectId'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateProjectRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Project updated successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProjectResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid project payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Project was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Projects'],
        summary: 'Delete a project by id',
        operationId: 'deleteProjectById',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          project: ['delete']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ProjectId'
          }
        ],
        responses: {
          '200': {
            description: 'Project deleted successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ProjectResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Project was not found.',
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
    },
    '/api/v1/service-requests/{id}': {
      get: {
        tags: ['Service Requests'],
        summary: 'Fetch a service request by id',
        description: 'Requires serviceRequest:read permission in the active organization.',
        operationId: 'getServiceRequestById',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          serviceRequest: ['read']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ServiceRequestId'
          }
        ],
        responses: {
          '200': {
            description: 'Service request fetched successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ServiceRequestResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Service request was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      put: {
        tags: ['Service Requests'],
        summary: 'Update a service request by id',
        description: 'Requires serviceRequest:update permission in the active organization.',
        operationId: 'updateServiceRequestById',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          serviceRequest: ['update']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ServiceRequestId'
          }
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                $ref: '#/components/schemas/UpdateServiceRequestRequest'
              }
            }
          }
        },
        responses: {
          '200': {
            description: 'Service request updated successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ServiceRequestResponse'
                }
              }
            }
          },
          '400': {
            description: 'Invalid service request payload.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Service request was not found.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ApiResponse'
                }
              }
            }
          }
        }
      },
      delete: {
        tags: ['Service Requests'],
        summary: 'Delete a service request by id',
        description: 'Requires serviceRequest:delete permission in the active organization.',
        operationId: 'deleteServiceRequestById',
        security: [
          {
            cookieAuth: []
          }
        ],
        'x-requiredPermissions': {
          serviceRequest: ['delete']
        },
        parameters: [
          {
            $ref: '#/components/parameters/ServiceRequestId'
          }
        ],
        responses: {
          '200': {
            description: 'Service request deleted successfully.',
            content: {
              'application/json': {
                schema: {
                  $ref: '#/components/schemas/ServiceRequestResponse'
                }
              }
            }
          },
          '401': {
            $ref: '#/components/responses/Unauthorized'
          },
          '403': {
            $ref: '#/components/responses/Forbidden'
          },
          '404': {
            description: 'Service request was not found.',
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
    securitySchemes: {
      cookieAuth: {
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token'
      }
    },
    responses: {
      Unauthorized: {
        description: 'Authentication is required.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse'
            }
          }
        }
      },
      Forbidden: {
        description: 'Authenticated user does not have the required permission.',
        content: {
          'application/json': {
            schema: {
              $ref: '#/components/schemas/ApiResponse'
            }
          }
        }
      }
    },
    parameters: {
      LeadId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          minLength: 1
        },
        example: 'clx0000000000000000000004'
      },
      ServiceRequestId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          minLength: 1
        },
        example: 'clx0000000000000000000006'
      },
      ServiceRequestProposalServiceRequestId: {
        name: 'serviceRequestId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          minLength: 1
        },
        example: 'clx0000000000000000000006'
      },
      ServiceRequestProjectServiceRequestId: {
        name: 'serviceRequestId',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          minLength: 1
        },
        example: 'clx0000000000000000000006'
      },
      ProjectId: {
        name: 'id',
        in: 'path',
        required: true,
        schema: {
          type: 'string',
          minLength: 1
        },
        example: 'clx0000000000000000000010'
      }
    },
    schemas: {
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
      ServiceRequestStatus: {
        type: 'string',
        enum: enumValues(ServiceRequestStatus),
        example: ServiceRequestStatus.NEW
      },
      ProposalStatus: {
        type: 'string',
        enum: enumValues(ProposalStatus),
        example: ProposalStatus.DRAFT
      },
      ProposalPaymentStatus: {
        type: 'string',
        enum: enumValues(ProposalPaymentStatus),
        example: ProposalPaymentStatus.UNPAID
      },
      ProjectStatus: {
        type: 'string',
        enum: enumValues(ProjectStatus),
        example: ProjectStatus.PLANNING
      },
      ProjectMemberRole: {
        type: 'string',
        enum: enumValues(ProjectMemberRole),
        example: ProjectMemberRole.MANAGER
      },
      ProjectCurrency: {
        type: 'string',
        enum: enumValues(ProjectCurrency),
        default: ProjectCurrency.USD,
        example: ProjectCurrency.USD
      },
      OrganizationRole: {
        type: 'string',
        enum: enumValues(Role),
        example: Role.CLIENT
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
      MeUser: {
        type: 'object',
        required: ['id', 'name', 'email'],
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
          }
        }
      },
      PermissionStatements: {
        type: 'object',
        description: 'Role permission statements keyed by resource. The values are allowed CRUD or domain actions.',
        additionalProperties: {
          type: 'array',
          items: {
            type: 'string',
            example: 'read'
          }
        },
        example: {
          ac: ['read'],
          serviceRequest: ['create', 'read'],
          project: ['read'],
          dashboard: ['read']
        }
      },
      Me: {
        type: 'object',
        required: ['user', 'organizationId', 'memberId', 'role', 'permissions'],
        properties: {
          user: {
            $ref: '#/components/schemas/MeUser'
          },
          organizationId: {
            type: 'string',
            example: 'seed-org-fanatic-coders'
          },
          memberId: {
            type: 'string',
            example: 'seed-member-client'
          },
          role: {
            $ref: '#/components/schemas/OrganizationRole'
          },
          permissions: {
            $ref: '#/components/schemas/PermissionStatements'
          }
        }
      },
      MeResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                $ref: '#/components/schemas/Me'
              }
            }
          }
        ]
      },
      User: {
        type: 'object',
        required: ['id', 'name', 'email', 'emailVerified', 'createdAt', 'updatedAt'],
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
        required: ['id', 'name', 'email', 'serviceInterest', 'status', 'source', 'createdAt', 'updatedAt'],
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
      UpdateLeadRequest: {
        type: 'object',
        minProperties: 1,
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
          },
          status: {
            $ref: '#/components/schemas/LeadStatus'
          }
        }
      },
      ServiceRequestData: {
        type: 'object',
        additionalProperties: true,
        description: 'Service-specific answers collected from the selected service template.',
        example: {
          websiteUrl: 'https://example.com',
          targetKeywords: ['seo agency', 'web development']
        }
      },
      ServiceRequest: {
        type: 'object',
        required: ['id', 'clientId', 'service', 'status', 'createdAt', 'updatedAt'],
        properties: {
          id: {
            type: 'string',
            example: 'clx0000000000000000000006'
          },
          clientId: {
            type: 'string',
            example: 'clx0000000000000000000005'
          },
          service: {
            $ref: '#/components/schemas/ServiceInterest'
          },
          status: {
            $ref: '#/components/schemas/ServiceRequestStatus'
          },
          data: {
            nullable: true,
            allOf: [
              {
                $ref: '#/components/schemas/ServiceRequestData'
              }
            ]
          },
          proposal: {
            nullable: true,
            allOf: [
              {
                $ref: '#/components/schemas/Proposal'
              }
            ]
          },
          project: {
            type: 'object',
            nullable: true,
            description: 'Linked project reference once this service request has been converted into a project.',
            required: ['id'],
            properties: {
              id: {
                type: 'string',
                example: 'clx0000000000000000000011'
              }
            }
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
      CreateServiceRequestRequest: {
        type: 'object',
        required: ['service'],
        properties: {
          service: {
            $ref: '#/components/schemas/ServiceInterest'
          },
          data: {
            $ref: '#/components/schemas/ServiceRequestData'
          }
        }
      },
      UpdateServiceRequestRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          status: {
            $ref: '#/components/schemas/ServiceRequestStatus'
          },
          data: {
            $ref: '#/components/schemas/ServiceRequestData'
          }
        }
      },
      Proposal: {
        type: 'object',
        required: ['id', 'serviceRequestId', 'createdByMemberId', 'description', 'amount', 'currency', 'status', 'paymentStatus', 'createdAt', 'updatedAt'],
        properties: {
          id: {
            type: 'string',
            example: 'clx0000000000000000000020'
          },
          serviceRequestId: {
            type: 'string',
            example: 'clx0000000000000000000006'
          },
          createdByMemberId: {
            type: 'string',
            example: 'seed-member-manager'
          },
          description: {
            type: 'string',
            example: 'Design and develop the agreed business website.'
          },
          amount: {
            type: 'number',
            format: 'decimal',
            example: 5000
          },
          currency: {
            $ref: '#/components/schemas/ProjectCurrency'
          },
          status: {
            $ref: '#/components/schemas/ProposalStatus'
          },
          paymentStatus: {
            $ref: '#/components/schemas/ProposalPaymentStatus'
          },
          acceptedAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2026-07-30T10:00:00.000Z'
          },
          paidAt: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2026-07-30T10:05:00.000Z'
          },
          stripeInvoiceId: {
            type: 'string',
            nullable: true,
            example: 'in_1Example'
          },
          stripeInvoiceNumber: {
            type: 'string',
            nullable: true,
            example: 'A1B2C3D4-0001'
          },
          stripeHostedInvoiceUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example: 'https://invoice.stripe.com/i/example'
          },
          stripeInvoicePdfUrl: {
            type: 'string',
            format: 'uri',
            nullable: true,
            example: 'https://pay.stripe.com/invoice/example/pdf'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-30T09:00:00.000Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-30T10:05:00.000Z'
          }
        }
      },
      CreateProposalRequest: {
        type: 'object',
        required: ['description', 'amount', 'currency'],
        properties: {
          description: {
            type: 'string',
            minLength: 1,
            maxLength: 10000,
            example: 'Design and develop the agreed business website.'
          },
          amount: {
            type: 'number',
            exclusiveMinimum: 0,
            example: 5000
          },
          currency: {
            $ref: '#/components/schemas/ProjectCurrency'
          }
        }
      },
      UpdateProposalRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          description: {
            type: 'string',
            minLength: 1,
            maxLength: 10000
          },
          amount: {
            type: 'number',
            exclusiveMinimum: 0
          },
          currency: {
            $ref: '#/components/schemas/ProjectCurrency'
          },
          status: {
            $ref: '#/components/schemas/ProposalStatus'
          }
        }
      },
      ProjectMember: {
        type: 'object',
        required: ['id', 'projectId', 'memberId', 'role', 'createdAt', 'updatedAt'],
        properties: {
          id: {
            type: 'string',
            example: 'clx0000000000000000000011'
          },
          projectId: {
            type: 'string',
            example: 'clx0000000000000000000010'
          },
          memberId: {
            type: 'string',
            example: 'seed-member-manager'
          },
          role: {
            $ref: '#/components/schemas/ProjectMemberRole'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-21T06:30:00.000Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-21T06:30:00.000Z'
          }
        }
      },
      Project: {
        type: 'object',
        required: ['id', 'clientId', 'createdByMemberId', 'name', 'service', 'status', 'currency', 'createdAt', 'updatedAt'],
        properties: {
          id: {
            type: 'string',
            example: 'clx0000000000000000000010'
          },
          clientId: {
            type: 'string',
            example: 'clx0000000000000000000005'
          },
          serviceRequestId: {
            type: 'string',
            nullable: true,
            example: 'clx0000000000000000000006'
          },
          createdByMemberId: {
            type: 'string',
            example: 'seed-member-admin'
          },
          name: {
            type: 'string',
            example: 'Acme website redesign'
          },
          description: {
            type: 'string',
            nullable: true,
            example: 'Website redesign project created from the client service request.'
          },
          service: {
            $ref: '#/components/schemas/ServiceInterest'
          },
          status: {
            $ref: '#/components/schemas/ProjectStatus'
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2026-08-01T00:00:00.000Z'
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            nullable: true,
            example: '2026-09-15T00:00:00.000Z'
          },
          budgetAmount: {
            type: 'number',
            format: 'decimal',
            nullable: true,
            example: 25000
          },
          currency: {
            $ref: '#/components/schemas/ProjectCurrency'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-21T06:30:00.000Z'
          },
          updatedAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-21T06:30:00.000Z'
          },
          memberProjects: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/ProjectMember'
            }
          }
        }
      },
      CreateProjectRequest: {
        type: 'object',
        required: ['clientId', 'name', 'service'],
        properties: {
          clientId: {
            type: 'string',
            minLength: 1,
            example: 'clx0000000000000000000005'
          },
          serviceRequestId: {
            type: 'string',
            minLength: 1,
            example: 'clx0000000000000000000006'
          },
          managerMemberId: {
            type: 'string',
            minLength: 1,
            description: 'Admin-only manager assignment. Managers are assigned to self by the backend.',
            example: 'seed-member-manager'
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            example: 'Acme website redesign'
          },
          description: {
            type: 'string',
            maxLength: 10000,
            example: 'Website redesign project created from discovery.'
          },
          service: {
            $ref: '#/components/schemas/ServiceInterest'
          },
          status: {
            $ref: '#/components/schemas/ProjectStatus'
          },
          startDate: {
            type: 'string',
            format: 'date-time'
          },
          endDate: {
            type: 'string',
            format: 'date-time'
          },
          budgetAmount: {
            type: 'number',
            minimum: 0,
            example: 25000
          },
          currency: {
            $ref: '#/components/schemas/ProjectCurrency'
          }
        }
      },
      CreateProjectFromServiceRequestRequest: {
        type: 'object',
        properties: {
          managerMemberId: {
            type: 'string',
            minLength: 1,
            description: 'Admin-only manager assignment. Managers are assigned to self by the backend.',
            example: 'seed-member-manager'
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255,
            example: 'Acme website redesign'
          },
          description: {
            type: 'string',
            maxLength: 10000,
            example: 'Project created from the accepted service request.'
          },
          status: {
            $ref: '#/components/schemas/ProjectStatus'
          },
          startDate: {
            type: 'string',
            format: 'date-time'
          },
          endDate: {
            type: 'string',
            format: 'date-time'
          },
          budgetAmount: {
            type: 'number',
            minimum: 0,
            example: 25000
          },
          currency: {
            $ref: '#/components/schemas/ProjectCurrency'
          }
        }
      },
      UpdateProjectRequest: {
        type: 'object',
        minProperties: 1,
        properties: {
          managerMemberId: {
            type: 'string',
            nullable: true,
            minLength: 1,
            description: 'Admin-only manager reassignment. Managers are assigned to self by the backend.',
            example: 'seed-member-manager'
          },
          name: {
            type: 'string',
            minLength: 1,
            maxLength: 255
          },
          description: {
            type: 'string',
            nullable: true,
            maxLength: 10000
          },
          status: {
            $ref: '#/components/schemas/ProjectStatus'
          },
          startDate: {
            type: 'string',
            format: 'date-time',
            nullable: true
          },
          endDate: {
            type: 'string',
            format: 'date-time',
            nullable: true
          },
          budgetAmount: {
            type: 'number',
            nullable: true,
            minimum: 0
          },
          currency: {
            $ref: '#/components/schemas/ProjectCurrency'
          }
        }
      },
      RequestPasswordResetRequest: {
        type: 'object',
        required: ['email'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            example: 'customer@example.com'
          },
          redirectTo: {
            type: 'string',
            format: 'uri',
            description: 'Optional frontend reset password page. Origin must be configured as a trusted frontend origin.',
            example: 'http://localhost:3000/reset-password'
          }
        }
      },
      RequestPasswordResetResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            properties: {
              data: {
                nullable: true,
                example: null
              },
              message: {
                type: 'string',
                example: 'If an account exists for this email, a password reset link has been sent.'
              }
            }
          }
        ]
      },
      InviteMemberRole: {
        type: 'string',
        enum: ['MANAGER', 'MEMBER', 'CLIENT'],
        example: 'CLIENT'
      },
      InviteMemberRequest: {
        type: 'object',
        required: ['email', 'role'],
        properties: {
          email: {
            type: 'string',
            format: 'email',
            maxLength: 255,
            example: 'client@example.com'
          },
          role: {
            $ref: '#/components/schemas/InviteMemberRole'
          },
          serviceInterest: {
            $ref: '#/components/schemas/ServiceInterest'
          },
          resend: {
            type: 'boolean',
            description: 'Resend the invitation email if a pending invitation already exists.',
            example: true
          }
        }
      },
      Invitation: {
        type: 'object',
        required: ['id', 'email', 'role', 'organizationId', 'inviterId', 'status', 'expiresAt'],
        properties: {
          id: {
            type: 'string',
            example: 'clx0000000000000000000005'
          },
          email: {
            type: 'string',
            format: 'email',
            example: 'client@example.com'
          },
          role: {
            type: 'string',
            example: 'CLIENT'
          },
          serviceInterest: {
            $ref: '#/components/schemas/ServiceInterest'
          },
          organizationId: {
            type: 'string',
            example: 'seed-org-fanatic-coders'
          },
          inviterId: {
            type: 'string',
            example: 'seed-user-admin'
          },
          status: {
            type: 'string',
            example: 'pending'
          },
          expiresAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-08T06:30:00.000Z'
          },
          createdAt: {
            type: 'string',
            format: 'date-time',
            example: '2026-07-06T06:30:00.000Z'
          }
        }
      },
      InvitationResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                $ref: '#/components/schemas/Invitation'
              }
            }
          }
        ]
      },
      LeadsResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                $ref: '#/components/schemas/PaginatedLeads'
              }
            }
          }
        ]
      },
      PaginationMeta: {
        type: 'object',
        required: ['page', 'pageSize', 'totalItems', 'totalPages'],
        properties: {
          page: {
            type: 'integer',
            minimum: 1,
            example: 1
          },
          pageSize: {
            type: 'integer',
            minimum: 1,
            example: 10
          },
          totalItems: {
            type: 'integer',
            minimum: 0,
            example: 24
          },
          totalPages: {
            type: 'integer',
            minimum: 0,
            example: 3
          }
        }
      },
      PaginatedLeads: {
        type: 'object',
        required: ['items', 'pagination'],
        properties: {
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Lead'
            }
          },
          pagination: {
            $ref: '#/components/schemas/PaginationMeta'
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
      ServiceRequestsResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/ServiceRequest'
                }
              }
            }
          }
        ]
      },
      ServiceRequestResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                $ref: '#/components/schemas/ServiceRequest'
              }
            }
          }
        ]
      },
      ProposalResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                $ref: '#/components/schemas/Proposal'
              }
            }
          }
        ]
      },
      ProjectsResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                $ref: '#/components/schemas/PaginatedProjects'
              }
            }
          }
        ]
      },
      PaginatedProjects: {
        type: 'object',
        required: ['items', 'pagination'],
        properties: {
          items: {
            type: 'array',
            items: {
              $ref: '#/components/schemas/Project'
            }
          },
          pagination: {
            $ref: '#/components/schemas/PaginationMeta'
          }
        }
      },
      ProjectResponse: {
        allOf: [
          {
            $ref: '#/components/schemas/ApiResponse'
          },
          {
            type: 'object',
            required: ['data'],
            properties: {
              data: {
                $ref: '#/components/schemas/Project'
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
