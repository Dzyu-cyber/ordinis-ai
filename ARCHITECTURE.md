# Ordinis AI — Technical Architecture Specification (Blueprint)

This document serves as the system architecture blueprint and engineering specification for **Ordinis AI**. It defines the system architecture, module boundaries, database schema, api paths, folder layout, authentication, and workflow events.

---

## 1. System Architecture

Ordinis AI is structured as a decoupled Client-Server architecture:

```
┌────────────────────────────────────────────────────────┐
│                   Frontend (Client)                    │
│  - React, Vite, TypeScript, Tailwind CSS               │
│  - State management & Caching: React Query             │
│  - Communicates via Axios with HTTP-only cookies      │
└───────────────────────────┬────────────────────────────┘
                            │ (REST API / HTTPS)
                            ▼
┌────────────────────────────────────────────────────────┐
│                   Backend (Server)                     │
│  - Node.js, Express, TypeScript                        │
│  - Modular Service-Oriented architecture               │
│  - Validation via Zod Schemas                          │
└───────────────────────────┬────────────────────────────┘
                            ├────────────────────────────┐
                            ▼                            ▼
┌────────────────────────────────────────────────┐ ┌──────────────────────────────────────┐
│                  Database                      │ │         External Services            │
│  - PostgreSQL (via Supabase)                   │ │  - OpenAI API (Structured Outputs)   │
│  - Sequential SQL schema migrations            │ │  - Gmail (SMTP/OAuth)                │
│  - Direct PG connection pool (backend/db)      │ │  - WhatsApp Client (Mock/Meta Cloud) │
└────────────────────────────────────────────────┘ │  - n8n Webhook Orchestration Engine  │
                                                   └──────────────────────────────────────┘
```

---

## 2. Module Boundaries

To ensure scalability and maintainability, the application is divided into self-contained modules. Each module owns its routing, business logic (Services), database queries (Models/Repositories), schema validation, and Type definitions.

### Module 1: Auth & User Management
- **Responsibility**: Registration, secure authentication, session validation, and profile settings.
- **Privacy**: Access to other modules is blocked without active auth sessions.

### Module 2: CRM & Lead Engine
- **Responsibility**: Capture leads, perform AI qualification/scoring, maintain lead statuses, and update CRM records.
- **Interactions**: Calls the AI Service for qualification and triggers Workflow Service for lead ingestion.

### Module 3: Unified Communication Hub
- **Responsibility**: Threaded messages (Email, WhatsApp), message indexing, classification, AI draft replies, and human escalation.
- **Interactions**: Interacts with Gmail/WhatsApp adapters and saves message history in CRM conversations.

### Module 4: Document Intelligence
- **Responsibility**: Secure document uploads, OCR/extraction tasks, JSON formatting, and database storage.
- **Interactions**: Uses AI Service (GPT-4o Vision) via a clean extraction adapter interface.

### Module 5: Reporting & Analytics
- **Responsibility**: Aggregates conversion metrics, email response rates, documents parsed, and generates AI executive summaries.
- **Interactions**: Query-only access across other modules' database tables.

### Module 6: Workflow & Integration Engine
- **Responsibility**: Configures event hooks, executes backend-initiated webhooks to n8n, and handles n8n incoming updates.
- **Interactions**: Listens for system-wide event triggers.

---

## 3. Service Responsibilities

All business logic is encapsulated in isolated services. Routes and controllers must never execute database queries or compute business logic directly.

| Service Name | Primary Responsibility | Key Operations |
| :--- | :--- | :--- |
| `AuthService` | User session lifecycle, password cryptography | `register()`, `login()`, `logout()`, `verifyToken()` |
| `LeadService` | CRM management, lead qualification pipeline | `createLead()`, `updateLead()`, `qualifyLead(id)` |
| `CommunicationService` | Thread management, incoming/outgoing messaging | `getConversations()`, `sendMessage()`, `receiveMessage()` |
| `AIService` | Direct interface to OpenAI API | `generateStructuredOutput()`, `analyzeImage()` |
| `DocumentService` | File upload handling, JSON document parsing | `uploadDocument()`, `processDocument(id)` |
| `ReportingService` | Metrics calculations, system performance summaries | `getDashboardStats()`, `generateDailySummary()` |
| `WorkflowService` | Webhook dispatch, event orchestration with n8n | `triggerEvent(eventName, payload)` |

---

## 4. API Directory Map (RESTful Conventions)

All APIs return unified responses:
- Success: `{ "success": true, "data": { ... } }`
- Failure: `{ "success": false, "error": { "message": "Reason", "code": "ERR_CODE" } }`

```
/api/auth
  POST   /register          # Register new business account
  POST   /login             # Authenticate & set HTTP-only cookie
  POST   /logout            # Clear JWT auth cookie
  GET    /me                # Get current logged-in user profile

/api/leads
  GET    /                  # List and filter leads (paginated)
  POST   /                  # Capture a new lead manually / public API
  GET    /:id               # Fetch specific lead details
  PUT    /:id               # Update lead status / information
  DELETE /:id               # Delete/Archive a lead
  POST   /:id/qualify       # Manually trigger AI qualification

/api/communication
  GET    /conversations     # List active message threads
  GET    /conversations/:id # Fetch message history for a lead
  POST   /messages/send     # Send email/WhatsApp response
  POST   /messages/webhook  # Ingest incoming message events

/api/documents
  POST   /upload            # Upload file & enqueue parsing task
  GET    /                  # List uploaded documents
  GET    /:id               # Fetch specific document data
  POST   /:id/process       # Manually trigger document extraction

/api/reports
  GET    /summary           # Retrieve AI daily/weekly summaries
  GET    /analytics         # Fetch CRM conversion and metrics dashboard
```

---

## 5. Database Schema & Relationships

Primary keys use UUIDs. Standard indexing is applied on foreign keys and fields frequently queried (e.g., status, email).

```mermaid
erDiagram
    users ||--o{ leads : manages
    users ||--o{ documents : uploads
    leads ||--o{ conversations : has
    conversations ||--o{ messages : contains
    leads ||--o{ meetings : schedules
    users ||--o{ activity_logs : triggers

    users {
        uuid id PK
        string email UNIQUE
        string password_hash
        string business_name
        string role
        timestamp created_at
    }

    leads {
        uuid id PK
        uuid user_id FK
        string name
        string email
        string phone
        string company
        string status
        integer score
        jsonb qualification_details
        timestamp created_at
    }

    conversations {
        uuid id PK
        uuid lead_id FK
        string channel
        timestamp last_message_at
        timestamp created_at
    }

    messages {
        uuid id PK
        uuid conversation_id FK
        string direction
        string sender
        text content
        boolean is_read
        timestamp created_at
    }

    documents {
        uuid id PK
        uuid user_id FK
        string filename
        string file_url
        string document_type
        string status
        jsonb parsed_content
        timestamp created_at
    }

    meetings {
        uuid id PK
        uuid lead_id FK
        string title
        timestamp scheduled_at
        integer duration_minutes
        string status
        timestamp created_at
    }

    activity_logs {
        uuid id PK
        uuid user_id FK
        string action
        jsonb details
        timestamp created_at
    }
```

---

## 6. Authentication Flow (JWT via HttpOnly Cookies)

```
[ Client App ]                   [ Express API Router ]               [ AuthService / DB ]
      │                                    │                                    │
      │ 1. POST /login (Credentials)       │                                    │
      ├───────────────────────────────────>│                                    │
      │                                    │ 2. Validate request, check hash    │
      │                                    ├───────────────────────────────────>│
      │                                    │                                    │ 3. Fetch User, verify password
      │                                    │<───────────────────────────────────┤
      │                                    │                                    │
      │                                    │ 4. Generate JWT                    │
      │                                    ├──────────────┐                     │
      │                                    │              │ (Sign Token)        │
      │                                    │<─────────────┘                     │
      │                                    │                                    │
      │ 5. Set Cookie (HttpOnly, Secure)   │                                    │
      │    Send 200 OK success response    │                                    │
      │<───────────────────────────────────┤                                    │
      │                                    │                                    │
      │ 6. GET /api/leads (Cookie Sent)    │                                    │
      ├───────────────────────────────────>│                                    │
      │                                    │ 7. authMiddleware reads Cookie     │
      │                                    ├──────────────┐                     │
      │                                    │              │ (Verify & Decode)   │
      │                                    │<─────────────┘                     │
      │                                    │                                    │
      │                                    │ 8. Forward to LeadController       │
      │                                    ├───────────────────────────────────>│
      │                                    │                                    │ 9. Query leads for User
      │                                    │<───────────────────────────────────┤
      │ 10. Return Leads data              │                                    │
      │<───────────────────────────────────┤                                    │
```

---

## 7. Workflow Event Integration Flow (n8n Webhook)

Webhooks act as the notification and orchestration bridge between Ordinis AI and n8n:

1. **System Event Trigger**: An action occurs in the backend (e.g., `lead_created`, `document_processed`).
2. **Workflow Dispatch**: `WorkflowService.triggerEvent(event, payload)` checks configured webhooks and fires an asynchronous POST request to the n8n endpoint.
3. **n8n Processing**: n8n runs automated tasks (e.g., email notification, Google Calendar booking, Slack alert).
4. **Callback (optional)**: n8n triggers the Ordinis API backend to update lead/meeting status via authenticated routes.
