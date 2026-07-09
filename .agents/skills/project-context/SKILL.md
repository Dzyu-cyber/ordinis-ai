---
name: project-context
description: Provides complete context for Ordinis AI, including architecture, engineering conventions, project status, module structure, and development roadmap. Always load this skill before starting any coding session.
---

# Project: Ordinis AI

## Overview

Ordinis AI is an AI-powered Revenue & Operations Operating System (AI Business OS) for Small and Medium Businesses.

Its purpose is to automate the complete customer lifecycle:

Lead Capture → AI Qualification → Communication → CRM → Meeting Booking → Document Processing → Reporting → Workflow Automation.

The project is designed as a long-term engineering platform rather than a tutorial project. Every new AI capability should be added as a module within Ordinis AI instead of creating separate projects.

---

# Long-Term Vision

The project should evolve into a modular AI platform capable of handling every repetitive business process.

Future modules may include:

* AI Customer Support
* Voice Agents
* Internal Knowledge Base (RAG)
* AI Employees
* Business Intelligence
* Multi-tenant SaaS
* Marketplace Integrations

All code should support future expansion without requiring major architectural rewrites.

---

# High-Level Architecture

```
Frontend (React + Vite)

        │

 REST API

        │

Backend (Node.js + Express)

        │

Business Services

├── AI Service
├── Lead Service
├── Communication Service
├── Document Service
├── Reporting Service
└── Workflow Service

        │

PostgreSQL (Supabase)

        │

External Services

├── OpenAI
├── n8n
├── Gmail
├── WhatsApp
├── OCR Provider
└── Future Integrations
```

---

# Module Structure

The backend should remain modular.

Each module should contain its own:

* Routes
* Controllers
* Services
* Validation
* Types
* Utilities (if module-specific)

Business logic belongs inside Services.

Controllers should only:

* Validate requests
* Call services
* Return responses

---

# Suggested Folder Structure

```
frontend/

src/

components/
pages/
layouts/
hooks/
services/
utils/
types/
assets/

backend/

src/

config/
controllers/
middleware/
models/
routes/
services/
validators/
utils/
types/

database/

migrations/
seed/

docs/

.agents/

skills/
```

---

# Development Philosophy

Always build vertically.

Every feature should be implemented end-to-end before moving to the next feature.

Example:

Database

↓

Backend API

↓

AI Integration

↓

Automation

↓

Frontend

↓

Testing

Avoid building all frontends first or all APIs first.

---

# Current Project Status

## Completed

* Product vision finalized
* PRD completed
* Architecture selected
* Technology stack selected
* Module roadmap completed
* Engineering standards established

## In Progress

Project initialization.

## Next Milestone

Module 1 — Foundation

Includes:

* Repository setup
* React application
* Express server
* PostgreSQL connection
* Authentication
* Base dashboard
* Project structure

---

# Build Roadmap

Module 1

Foundation

↓

Module 2

AI Lead Engine

↓

Module 3

Communication Hub

↓

Module 4

Document Intelligence

↓

Module 5

Reporting Center

↓

Module 6

Workflow Engine

Future modules should be added after these are complete.

---

# Environment Variables

## Backend

DATABASE_URL

SUPABASE_URL

SUPABASE_ANON_KEY

SUPABASE_SERVICE_ROLE_KEY

JWT_SECRET

OPENAI_API_KEY

N8N_WEBHOOK_URL

GMAIL_CLIENT_ID

GMAIL_CLIENT_SECRET

GMAIL_REFRESH_TOKEN

---

## Frontend

VITE_API_URL

VITE_SUPABASE_URL

VITE_SUPABASE_ANON_KEY

---

# Naming Conventions

## React Components

PascalCase

Example:

LeadCard.tsx

CommunicationPanel.tsx

---

## Hooks

camelCase with use prefix

Examples:

useAuth.ts

useLeads.ts

useDashboard.ts

---

## Utilities

camelCase

Examples:

formatDate.ts

calculateLeadScore.ts

extractInvoiceData.ts

---

## Services

PascalCase + Service

Examples:

LeadService.ts

AIService.ts

DocumentService.ts

WorkflowService.ts

---

## Controllers

PascalCase + Controller

Example:

LeadController.ts

---

## Routes

kebab-case

Examples:

/api/leads

/api/documents

/api/reports

---

## Database Tables

snake_case

Examples:

users

leads

messages

documents

meetings

reports

workflows

---

# Coding Standards

Every new feature should:

* Follow modular architecture.
* Use TypeScript types.
* Handle loading states.
* Handle errors gracefully.
* Validate inputs.
* Return consistent API responses.
* Be reusable where possible.

Avoid duplicate code.

---

# AI Standards

Whenever integrating AI:

* Prefer Structured Outputs.
* Validate AI responses.
* Handle failures gracefully.
* Log AI errors.
* Never assume AI output is correct.

---

# Automation Standards

Use n8n only for orchestration.

Business logic belongs inside the backend.

n8n should call backend APIs instead of replacing them.

---

# Current Project Principles

1. Build one platform, not many small projects.
2. Keep the architecture modular.
3. Every feature should be production-ready.
4. Simplicity beats cleverness.
5. Design for future expansion.

---

# Files That Should Not Be Modified Without Approval

* PRD.md
* .agents/agents.md
* .agents/skills/project-context/SKILL.md
* Database schema after production migration
* Authentication middleware
* Shared TypeScript types
* Environment configuration
* Core routing structure

These files define the project's architecture and should only change with explicit approval.

---

# Session Reminder

At the start of every coding session:

1. Read this skill.
2. Review the current project status.
3. Identify the active module.
4. Implement only the requested task.
5. Avoid unrelated refactoring.
6. Preserve the project's architecture and coding standards.

Always build Ordinis AI as a production-quality AI Business Operating System, not as a collection of disconnected demos.
