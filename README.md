# 🏛️ Prime Academic Manager ERP (`AH-stacked`)

> **Enterprise Monorepo ERP, Academic Operations Engine & Asynchronous Cloud Reporting Suite** engineered for **The Prime Classes** to replace legacy Google Apps Script architectures with a production-grade **NestJS**, **Next.js 15**, **PostgreSQL**, and **BullMQ** system.

<div align="center">

[![Turborepo](https://img.shields.io/badge/Turborepo-Monorepo-EF4444?style=for-the-badge&logo=turborepo&logoColor=white)](https://turbo.build/)
[![NestJS](https://img.shields.io/badge/NestJS-10.x-E0234E?style=for-the-badge&logo=nestjs&logoColor=white)](https://nestjs.com/)
[![Next.js](https://img.shields.io/badge/Next.js-15.1-000000?style=for-the-badge&logo=nextdotjs&logoColor=white)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma&logoColor=white)](https://www.prisma.io/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16-4169E1?style=for-the-badge&logo=postgresql&logoColor=white)](https://www.postgresql.org/)
[![BullMQ](https://img.shields.io/badge/BullMQ-Redis_Queues-DC382D?style=for-the-badge&logo=redis&logoColor=white)](https://bullmq.io/)
[![Docker](https://img.shields.io/badge/Docker-Ready-2496ED?style=for-the-badge&logo=docker&logoColor=white)](https://www.docker.com/)
[![Swagger](https://img.shields.io/badge/Swagger-OpenAPI_3.0-85EA2D?style=for-the-badge&logo=swagger&logoColor=black)](https://swagger.io/)

</div>

---

## 📖 Table of Contents

- [Overview](#-overview)
- [Architecture & Migration Strategy](#-architecture--migration-strategy)
- [Key Features](#-key-features)
- [System Architecture Flow](#-system-architecture-flow)
- [Tech Stack](#-tech-stack)
- [Monorepo Structure](#-monorepo-structure)
- [Core Academic Modules](#-core-academic-modules)
- [Prerequisites](#-prerequisites)
- [Getting Started & Installation](#-getting-started--installation)
- [Environment Variables](#-environment-variables)
- [Database Setup & Hosting Options](#-database-setup--hosting-options)
- [Running the Monorepo](#-running-the-monorepo)
- [API Documentation & Swagger](#-api-documentation--swagger)
- [Production Deployment](#-production-deployment)
- [License](#-license)
- [Author](#-author)

---

## 🌟 Overview

**Prime Academic Manager ERP** is a comprehensive academic operations platform engineered for **The Prime Classes** coaching institute (specializing in **AISSEE Sainik School**, **Rashtriya Military Schools [RMS]**, and **Rashtriya Indian Military College [RIMC]**).

The system replaces legacy, unmaintainable Google Apps Script automations with a high-throughput, decoupled architecture:
- **PostgreSQL as Single Source of Truth**: All transactional queries, student enrollments, teacher assignments, and academic records are executed against PostgreSQL with sub-millisecond latencies.
- **Asynchronous BullMQ Sync Worker**: Writes are instantly committed to PostgreSQL, while a background **BullMQ + Redis** queue synchronizes data to Google Sheets for administrative reporting—ensuring users never wait on external Google API latency.
- **Modern Next.js 15 & React 19 Frontend**: Server Components, TanStack Query, React Hook Form, and Zod client-side validation.
- **Production Container Stack**: Complete multi-stage Docker builds, Nginx reverse proxy configuration, PM2 ecosystem setup, and deployment runbooks.

---

## 🏗️ Architecture & Migration Strategy

```
┌───────────────────────────┐         ┌───────────────────────────┐
│   Next.js 15 (React 19)   │         │    External API Clients   │
│      Web Client SPA       │         │    & Mobile Applications  │
└─────────────┬─────────────┘         └─────────────┬─────────────┘
              │                                     │
              │ HTTPS / REST / JWT Auth             │
              ▼                                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    NestJS API Gateway (:3001)                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Auth Guard • RBAC Matrix • ValidationPipe • Swagger Docs  │  │
│  └───────────────────────────────────────────────────────────┘  │
└──────────────────────────────┬──────────────────────────────────┘
                               │
               ┌───────────────┴───────────────┐
               ▼                               ▼
┌──────────────────────────────┐ ┌─────────────────────────────┐
│  PostgreSQL 16 (Primary DB)  │ │      Redis 7 + BullMQ       │
│  Prisma ORM Single Source of │ │  Asynchronous Job Queue     │
│  Truth (Zero Google Latency) │ │  Worker Sync Engine         │
└──────────────────────────────┘ └──────────────┬──────────────┘
                                                │
                                                ▼
                                 ┌─────────────────────────────┐
                                 │   Google Sheets Reporting   │
                                 │   Secondary Readout Layer   │
                                 └─────────────────────────────┘
```

---

## 🚀 Key Features

### 🎓 Student Lifecycle & Enrollment
- Comprehensive student profiles, target exam batch assignments, and inter-batch transfers.
- Automated sequential enrollment tracking with instant data consistency across database and reporting sheets.

### 👨‍🏫 Faculty & Academic Staff Management
- Complete teacher and employee records, department assignments, and subject allocation matrices.
- Teacher workload scheduling, lecture tracking, and performance rating inputs.

### 📚 Subjects, Batches & Timetable Engine
- Multi-tier academic catalog mapping subjects to AISSEE, RMS, and RIMC exam specifications.
- Batch scheduling, lecture room assignments, and conflict-free calendar views.

### 📋 Task Assignment & Performance Rating
- Task assignment system allowing institute heads to assign academic deliverables to teachers and staff.
- Daily ratings and performance reviews tracking execution velocity.

### 🔄 Asynchronous Google Sheets Synchronization
- High-throughput BullMQ background worker synchronizing PostgreSQL mutations to Google Sheets.
- Decoupled architecture: API response times are completely independent of Google Cloud quota limits.

---

## 🛠️ Tech Stack

| Domain | Technology | Version | Purpose |
|---|---|---|---|
| **Monorepo Manager** | [Turborepo](https://turbo.build/) | `^2.10.5` | Monorepo build caching and parallel pipeline orchestration |
| **Backend Framework** | [NestJS](https://nestjs.com/) | `10.x` | Enterprise modular server architecture and REST routing |
| **Frontend Framework** | [Next.js](https://nextjs.org/) + [React](https://react.dev/) | `15.1` / `19.0` | App Router, Server Components, and client state |
| **Language** | [TypeScript](https://www.typescriptlang.org/) | `5.4+` | Strict static typing across frontend, backend, and shared packages |
| **ORM** | [Prisma](https://www.prisma.io/) | `6.19.3` | Schema definition, automated migrations, and type-safe queries |
| **Primary Database** | [PostgreSQL](https://www.postgresql.org/) | `16` | Relational single source of truth |
| **Queue & Cache** | [BullMQ](https://bullmq.io/) & [Redis](https://redis.io/) | `7.x` | Background job processing and reporting synchronization |
| **Media CDN** | [Cloudinary](https://cloudinary.com/) | `^2.10.0` | Media uploads, student photographs, and document storage |
| **Google Cloud** | [googleapis](https://github.com/googleapis/google-api-nodejs-client) | `^137.0.0` | Google Sheets API v4 service account integration |
| **Containerization** | [Docker](https://www.docker.com/) & Docker Compose | Latest | Local persistent database and multi-stage production builds |
| **Process Manager** | [PM2](https://pm2.keymetrics.io/) | Latest | Production process management via `ecosystem.config.js` |

---

## 📂 Monorepo Structure

```text
AH-stacked/
├── apps/
│   ├── backend/                 # NestJS REST API Server
│   │   ├── src/                 # Controllers, services, and modules
│   │   ├── Dockerfile           # Multi-stage backend container build
│   │   └── package.json
│   └── frontend/                # Next.js 15 + React 19 Web Portal
│       ├── src/                 # Pages, components, and TanStack hooks
│       ├── Dockerfile           # Multi-stage frontend container build
│       └── package.json
├── database/
│   └── prisma/
│       ├── schema.prisma        # Canonical PostgreSQL schema
│       └── migrations/          # Database migration history
├── packages/
│   ├── shared/                  # Shared Zod validation schemas
│   └── types/                   # Shared TypeScript interfaces and contracts
├── scripts/
│   ├── check-database.js        # Database connectivity diagnostic
│   ├── seed-from-sheets.bat     # Seed PostgreSQL from Google Sheets
│   └── start-local-backend.js   # Local backend runner
├── compose.yml                  # Local development PostgreSQL Docker Compose
├── docker-compose.prod.yml      # Production stack (Nginx + Frontend + Backend)
├── ecosystem.config.js          # PM2 production cluster configuration
├── nginx.conf                   # Nginx reverse proxy configuration
├── package.json                 # Monorepo root manifest & workspaces
├── turbo.json                   # Turborepo task pipeline configuration
└── README.md                    # Comprehensive platform documentation
```

---

## 📋 Prerequisites

Before running the application, ensure your machine has:
- **Node.js**: `>= 20.0.0` (LTS recommended)
- **npm**: `>= 10.8.2`
- **Docker & Docker Compose**: For local PostgreSQL and containerized deployments
- **Google Service Account JSON**: With Google Sheets API enabled and `Editor` permissions on target reporting sheets
- *(Optional)* **Redis / Upstash**: For BullMQ queue workers

---

## ⚙️ Getting Started & Installation

### 1. Clone the Repository
```bash
git clone https://github.com/dms1234567890/AH-stacked.git
cd AH-stacked
```

### 2. Install Monorepo Dependencies
```bash
npm install
```

### 3. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

---

## 🔧 Environment Variables

```env
# -------------------------------------------------------------
# Database (PostgreSQL 16)
# -------------------------------------------------------------
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/prime_academic?schema=public"

# -------------------------------------------------------------
# Redis & BullMQ Queue
# -------------------------------------------------------------
REDIS_HOST="localhost"
REDIS_PORT=6379
REDIS_PASSWORD=""

# -------------------------------------------------------------
# JWT Authentication Secrets
# -------------------------------------------------------------
JWT_ACCESS_SECRET="your-super-secret-access-key-min-32-chars"
JWT_REFRESH_SECRET="your-super-secret-refresh-key-min-32-chars"
JWT_ACCESS_EXPIRES_IN="15m"
JWT_REFRESH_EXPIRES_IN="7d"

# -------------------------------------------------------------
# Google Cloud Service Account
# -------------------------------------------------------------
GOOGLE_SERVICE_ACCOUNT_EMAIL="your-sa@project.iam.gserviceaccount.com"
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
REPORTING_SPREADSHEET_ID="your-google-sheets-id"

# -------------------------------------------------------------
# Cloudinary Media Storage (Optional)
# -------------------------------------------------------------
CLOUDINARY_CLOUD_NAME=""
CLOUDINARY_API_KEY=""
CLOUDINARY_API_SECRET=""
```

---

## 🗄️ Database Setup & Hosting Options

### Option A: Local Persistent PostgreSQL (Docker)
Start the local PostgreSQL container with persistent volume storage:
```bash
npm run db:local:up
```

Verify connectivity:
```bash
npm run db:check
```

Generate Prisma Client and apply migrations:
```bash
npm run db:generate
npm run db:migrate
```

### Option B: Cloud PostgreSQL (Neon / Supabase)
Set `DATABASE_URL` in `.env` to your cloud connection string:
- For **Neon**, append `?connect_timeout=20&pool_timeout=20` to prevent cold-start timeouts.
- Run `npm run db:check` and `npm run db:push`.

---

## 🏃 Running the Monorepo

### Parallel Development Mode (Turbo)
Runs both Backend and Frontend concurrently with cached pipeline acceleration:
```bash
npm run dev
```

### Run Apps Individually
```bash
# Backend only (http://localhost:3001)
npm run backend:dev

# Frontend only (http://localhost:3000)
npm run frontend:dev
```

### Open Prisma Studio (Database Explorer)
```bash
npm run db:studio
```

---

## 📡 API Documentation & Swagger

When running the backend locally, access interactive OpenAPI documentation at:

```
http://localhost:3001/api/docs
```

### Core Service Modules:
1. **Authentication**: JWT access/refresh rotation, password hashing, and role checks
2. **Students**: Admissions, enrollment status, batch transitions, and profile records
3. **Employees & Teachers**: Staff directory, subject authorizations, and workload
4. **Subjects & Batches**: Defense entrance exam curriculum structuring
5. **Classes & Schedules**: Timetable generation and lecture management
6. **Tasks & Ratings**: Staff task assignment and performance reviews
7. **Sync Worker**: Asynchronous BullMQ background worker synchronizing to Google Sheets

---

## 🐳 Production Deployment

### Docker Multi-Stage Deployment
The repository includes a production-ready orchestration setup (`docker-compose.prod.yml` and `nginx.conf`):

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

### PM2 Process Manager
Deploy on a Virtual Private Server (Ubuntu/Debian) using PM2:

```bash
npm run build
pm2 start ecosystem.config.js --env production
```

---

## 📄 License

Proprietary — Developed for **The Prime Classes**. All rights reserved.

---

## 👤 Author

**The Prime Classes Engineering Team**
- Maintainer: [@Happybhai329](https://github.com/Happybhai329)
- Repository: [dms1234567890/AH-stacked](https://github.com/dms1234567890/AH-stacked)
