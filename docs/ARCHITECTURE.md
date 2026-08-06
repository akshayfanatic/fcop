# FCOP Backend Architecture

## Architecture documents

- **High-Level Design (current document):** system context, major components, and business flows
- **[Low-Level Design](./LOW_LEVEL_DESIGN.md):** routes, code layers, permissions, validation, state rules, and integration behavior

## 1. System overview

FCOP is a modular Express.js backend for managing the journey from lead capture to paid project delivery. It exposes REST APIs for business operations and Socket.IO for live chat.

```mermaid
flowchart LR
    User[Admin / Manager / Member / Client]
    Frontend[Frontend application]

    subgraph Backend[FCOP Backend - Node.js + Express]
        HTTP[REST API]
        WS[Socket.IO chat]
        Auth[Better Auth + organization RBAC]
        Domain[Business services]
        ORM[Prisma ORM]
    end

    DB[(MySQL)]
    Stripe[Stripe]
    Resend[Resend email]

    User --> Frontend
    Frontend -->|HTTPS / JSON| HTTP
    Frontend <-->|WebSocket events| WS
    HTTP --> Auth
    WS --> Auth
    Auth --> Domain
    HTTP --> Domain
    WS --> Domain
    Domain --> ORM
    ORM --> DB
    Domain -->|customers and invoices| Stripe
    Stripe -->|signed invoice.paid webhook| HTTP
    Domain -->|transactional email| Resend
```

## 2. Internal request architecture

The project uses a layered design. Routes define endpoints and permission requirements. Controllers validate input and translate HTTP concerns. Services enforce business rules and coordinate database or external-provider work.

```mermaid
flowchart TB
    Request[HTTP request]
    Global[Global middleware<br/>CORS, request logger, body parser]
    Route[Feature route]
    Guard[Authentication and organization permission guard]
    Controller[Controller]
    Validator[Zod validator]
    Service[Domain service]
    Prisma[Prisma Client]
    MySQL[(MySQL)]
    External[Stripe / Resend]
    Response[Standard API response]
    Errors[Not-found and error handlers]

    Request --> Global --> Route --> Guard --> Controller
    Controller --> Validator
    Validator -->|valid input| Service
    Validator -->|invalid input| Errors
    Service --> Prisma --> MySQL
    Service --> External
    Service --> Controller --> Response
    Guard -->|denied| Errors
    Service -->|business or system error| Errors
```

Typical code path:

`route -> permission middleware -> controller -> Zod validation -> service -> Prisma/external provider -> response`

## 3. Business workflow

```mermaid
flowchart LR
    Lead[Lead captured]
    Invite[Organization invitation]
    Client[Client account created]
    Request[Service request]
    Consult[Live consultation chat]
    Proposal[Proposal<br/>Draft -> Sent]
    Accept[Client accepts]
    Invoice[Stripe invoice sent]
    Paid[Stripe confirms payment]
    Project[Project created]
    Tasks[Tasks assigned and tracked]

    Lead --> Invite
    Invite -->|invitation accepted| Client
    Client --> Request
    Request <--> Consult
    Request --> Proposal --> Accept --> Invoice --> Paid
    Request --> Project --> Tasks

    Invite -.->|email| Mail1[Resend]
    Request -.->|email| Mail1
    Project -.->|email| Mail1
    Tasks -.->|assignment email| Mail1
```

Important rules:

- Accepting an invitation creates a client profile and marks a matching lead as qualified.
- Each service request can have at most one proposal and one linked project.
- Only a client can accept a sent proposal.
- Accepted proposal terms become immutable.
- Proposal acceptance creates or reuses a Stripe customer and sends an invoice.
- A verified `invoice.paid` webhook marks the proposal as paid idempotently.
- Project chat follows project access; service-request chat is restricted to the client and administrators.
- Internal chat messages are visible only to management.

## 4. Main backend modules

```mermaid
flowchart TB
    API[API Router /api]

    API --> Public[Public and platform<br/>health, docs, OpenAPI, lead capture]
    API --> Identity[Identity<br/>auth, me, invitations]
    API --> Sales[Sales<br/>leads, service requests, proposals]
    API --> Delivery[Delivery<br/>projects, tasks]
    API --> Reporting[Dashboard reporting]

    Identity --> BetterAuth[Better Auth]
    Sales --> StripeLib[Stripe customer and invoice adapters]
    Sales --> EmailLib[React Email + Resend]
    Delivery --> EmailLib

    Public --> Services[Domain services]
    Identity --> Services
    Sales --> Services
    Delivery --> Services
    Reporting --> Services
    Services --> Prisma[(Prisma / MySQL)]
```

Primary API groups:

| Area              | Base path                               | Purpose                                      |
| ----------------- | --------------------------------------- | -------------------------------------------- |
| Better Auth       | `/api/auth/*`                           | Better Auth session and account endpoints    |
| Auth helpers      | `/api/v1/auth`                          | Password-reset helper flow                   |
| Invitations       | `/api/v1/invitations`                   | Invite organization members/clients          |
| Leads             | `/api/v1/leads`                         | Capture and manage prospective clients       |
| Current user      | `/api/v1/me`                            | Return current member, role, and permissions |
| Service requests  | `/api/v1/service-requests`              | Manage client service demand                 |
| Proposals         | `/api/v1/service-requests/:id/proposal` | Commercial terms and client acceptance       |
| Projects          | `/api/v1/projects`                      | Project lifecycle and membership             |
| Project tasks     | `/api/v1/projects/:id/tasks`            | Create and list project tasks                |
| Tasks             | `/api/v1/tasks`                         | Cross-project task listing and task updates  |
| Dashboard         | `/api/v1/dashboard`                     | Operational summaries and attention lists    |
| Stripe webhook    | `/api/v1/stripe/webhooks`               | Verify Stripe events and record payment      |
| API documentation | `/api/docs`, `/api/openapi.json`        | Interactive docs and OpenAPI contract        |

## 5. Core data model

This diagram intentionally shows business relationships rather than every column.

```mermaid
erDiagram
    USER ||--o{ SESSION : has
    USER ||--o{ ACCOUNT : authenticates_with
    USER ||--o{ MEMBER : joins_as
    ORGANIZATION ||--o{ MEMBER : contains
    ORGANIZATION ||--o{ INVITATION : sends
    ORGANIZATION ||--o{ ORGANIZATION_ROLE : defines
    MEMBER ||--o| CLIENT : becomes
    CLIENT ||--o{ SERVICE_REQUEST : creates
    SERVICE_REQUEST ||--o| PROPOSAL : receives
    SERVICE_REQUEST ||--o| PROJECT : becomes
    CLIENT ||--o{ PROJECT : owns
    MEMBER ||--o{ MEMBER_PROJECT : participates
    PROJECT ||--o{ MEMBER_PROJECT : has
    PROJECT ||--o{ TASK : contains
    TASK ||--o{ TASK_ASSIGNEE : assigned_through
    MEMBER ||--o{ TASK_ASSIGNEE : receives
    CHAT_HISTORY }o--|| SERVICE_REQUEST : may_represent
    CHAT_HISTORY }o--|| PROJECT : may_represent
```

`ChatHistory` uses `channelType + channelId`, so its service-request/project relationships are logical rather than database foreign keys.

## 6. Authentication and authorization

```mermaid
sequenceDiagram
    participant F as Frontend
    participant A as Express API / Socket.IO
    participant B as Better Auth
    participant P as Permission middleware
    participant S as Service
    participant D as MySQL

    F->>A: Cookie session or Bearer token
    A->>B: Resolve session and active organization
    B->>D: Read user/member/session
    D-->>B: Identity and membership
    B-->>A: Current member
    A->>P: Check resource actions for member role
    alt Permission granted
        P->>S: Run business operation
        S->>D: Scoped query or mutation
        D-->>S: Result
        S-->>F: Success response
    else Permission denied
        P-->>F: 401/403 error
    end
```

Roles are organization-scoped: `ADMIN`, `MANAGER`, `MEMBER`, and `CLIENT`. Services add ownership and project-access checks where role permissions alone are insufficient.

## 7. Stripe payment sequence

```mermaid
sequenceDiagram
    participant C as Client
    participant API as Proposal API
    participant DB as MySQL
    participant ST as Stripe

    C->>API: Accept sent proposal
    API->>DB: Mark proposal ACCEPTED
    API->>ST: Create/reuse customer
    API->>ST: Create and send idempotent invoice
    ST-->>API: Invoice IDs and hosted URLs
    API->>DB: Store invoice details
    API-->>C: Accepted proposal + payment link
    C->>ST: Pay invoice
    ST->>API: Signed invoice.paid webhook
    API->>ST: Verify signature
    API->>DB: Change UNPAID to PAID once
    API-->>ST: Acknowledge event
```

The Stripe webhook route is mounted before `express.json()` because signature verification requires the original raw request body.

## 8. Live-chat sequence

```mermaid
sequenceDiagram
    participant F as Frontend
    participant IO as Socket.IO
    participant Auth as Better Auth session resolver
    participant DB as MySQL
    participant Room as Authorized room members

    F->>IO: Connect with cookie or Bearer token
    IO->>Auth: Resolve organization member
    Auth-->>IO: Authenticated member
    F->>IO: chat:join(channel)
    IO->>DB: Verify project/request access
    IO->>DB: Load retained history
    IO-->>F: Filtered history
    F->>IO: chat:send(message)
    IO->>DB: Save bounded history transactionally
    IO->>Room: chat:message
```

Chat history has configurable retention and maximum-message limits. Expired histories are removed when read.

## 9. Short explanation script

> FCOP backend is a modular Node.js and Express application. The frontend uses REST APIs for normal business operations and Socket.IO for live chat. Every protected request is resolved through Better Auth, an active organization, and role-based permissions. Routes call controllers, controllers validate inputs with Zod, and services enforce business rules before accessing MySQL through Prisma. The main business journey starts with a lead, continues through invitation and client onboarding, then service request, proposal, Stripe invoice and payment, and finally project and task delivery. Resend handles transactional emails, while signed Stripe webhooks keep payment status synchronized. The application is deployed as one backend process, but its feature modules and layers keep responsibilities separated.

## 10. Technology summary

| Concern                          | Technology                                     |
| -------------------------------- | ---------------------------------------------- |
| Runtime                          | Node.js 22+ and TypeScript                     |
| HTTP server                      | Express 4 on Node HTTP server                  |
| Real-time communication          | Socket.IO                                      |
| Authentication and organizations | Better Auth                                    |
| Authorization                    | Organization RBAC plus ownership/access checks |
| Validation                       | Zod                                            |
| Database                         | MySQL                                          |
| ORM                              | Prisma 7 with MariaDB adapter                  |
| Payments                         | Stripe invoices and signed webhooks            |
| Email                            | React Email templates and Resend               |
| Logging                          | Pino and pino-http                             |
| API contract                     | OpenAPI with interactive docs                  |
