# Prime Academic Manager ERP — Full Project Report

> **Report generated:** July 15, 2026  
> **Project root:** `e:\prime it\ah without gs`  
> **Stack:** Full-stack monorepo (NestJS + Next.js + PostgreSQL + Redis + Google Sheets)

---

## 1. Executive Summary

Prime Academic Manager is a production-grade ERP (Enterprise Resource Planning) system built for **Prime Academic Institute**. It was migrated from a single-threaded **Google Apps Script** web app to a modern dual-database SaaS architecture.

### Core Philosophy

| Layer | Role | Technology |
|-------|------|------------|
| **Source of Truth** | All reads/writes | **PostgreSQL** (Neon) via Prisma ORM |
| **Reporting Layer** | Async sync for legacy users | **Google Sheets** via BullMQ queue |
| **Queue Engine** | Async job processing | **BullMQ** over Redis (Upstash) |
| **Media Storage** | Images & uploads | **Cloudinary** |

The frontend is a **Next.js 15** app with **TanStack Query** for server-state management, and the backend is a **NestJS 10** API server with Swagger docs, JWT auth, RBAC, rate limiting, and full CRUD across 8 business modules.

---

## 2. Architecture Overview

### High-Level Flow

```
                    ┌─────────────────────────────────────────┐
                    │          Frontend (Next.js 15)          │
                    │  TanStack Query / React 19 / Tailwind   │
                    └────────────────┬────────────────────────┘
                                     │ HTTP/JSON (Axios)
                                     ▼
                    ┌─────────────────────────────────────────┐
                    │      Backend API (NestJS 10 / 3001)     │
                    │  Auth | Students | Batches | Tasks ...  │
                    └──────┬──────────────────┬───────────────┘
                           │                  │
                           ▼                  ▼
              ┌────────────────────┐  ┌──────────────────────┐
              │     PostgreSQL     │  │     BullMQ Queue     │
              │   (Neon - Primary) │  │  google-sheets-sync  │
              └────────────────────┘  └──────────┬───────────┘
                                                  │ 3 workers
                                                  ▼
                                     ┌──────────────────────┐
                                     │   Google Sheets API  │
                                     │  (Legacy Reporting)  │
                                     └──────────────────────┘
```

### Dual-Database Sync Pipeline

```
                         ┌──────────────────────────────────────────┐
                         │           CRUD Operation                │
                         │  (Students / Batches / Tasks / etc.)    │
                         └──────────────┬───────────────────────────┘
                                        │
                                        ▼
                    ┌───────────────────────────────────────────────┐
                    │        SyncService.queueSync()                 │
                    │  1. CREATE SyncLog (PENDING)                  │
                    │  2. ENQUEUE → BullMQ (exponential backoff)    │
                    └──────────────────────┬────────────────────────┘
                                           │
                    ┌──────────────────────▼────────────────────────┐
                    │        BullMQ Worker (3 concurrent)            │
                    │  - fetchEntityData() from PostgreSQL           │
                    │  - GoogleSheetsService.sync()                  │
                    │  - Update SyncLog (COMPLETED / FAILED)         │
                    │  - Retry: 5 attempts, 2s→4s→8s→16s→32s        │
                    └───────────────────────────────────────────────┘
```

---

## 3. Project Structure

```
prime-academic-manager/
├── apps/
│   ├── backend/                       # NestJS API server (port 3001)
│   │   ├── src/
│   │   │   ├── main.ts                # Bootstrap: CORS, Swagger, ValidationPipe
│   │   │   ├── app.module.ts          # Root module (imports all modules)
│   │   │   ├── auth/                  # JWT login/refresh/logout (Passport)
│   │   │   ├── users/                 # System user CRUD
│   │   │   ├── students/              # Student + admission CRUD, sync preview
│   │   │   ├── employees/             # Employee CRUD
│   │   │   ├── teachers/              # Teacher CRUD
│   │   │   ├── subjects/              # Subject CRUD
│   │   │   ├── batches/               # Batch CRUD + batch-subject mapping
│   │   │   ├── classes/               # Class schedule CRUD
│   │   │   ├── tasks/                 # Task workflow (PENDING→COMPLETED→RATED)
│   │   │   ├── sync/                  # BullMQ queue + Google Sheets service
│   │   │   └── common/                # Guards, decorators, PrismaService
│   │   └── dist/                      # Compiled output
│   │
│   └── frontend/                      # Next.js 15 app (port 3000)
│       └── src/
│           ├── app/
│           │   ├── auth/login/        # Login page w/ session persistence
│           │   ├── dashboard/         # Central navigation hub (10+ buttons)
│           │   ├── students/          # Student listing + active + sync status
│           │   ├── tasks/             # Task list + status filter + quick-create
│           │   ├── batches/           # Batch CRUD (add/edit/delete/list)
│           │   ├── subjects/          # Subject CRUD (add/list)
│           │   └── layout.tsx         # Root layout (QueryProvider + AuthProvider)
│           ├── contexts/
│           │   └── AuthContext.tsx     # Auth state w/ localStorage persistence
│           └── lib/
│               ├── api.ts             # Axios client (interceptors, typed endpoints)
│               ├── hooks.ts           # 17 TanStack Query hooks
│               └── QueryProvider.tsx   # QueryClient provider component
│
├── packages/
│   ├── types/         # Shared DTOs (StudentDto, BatchDto, TaskDto, etc.)
│   └── shared/        # Zod validation schemas
│
├── database/
│   └── prisma/
│       └── schema.prisma   # 15 models, 4 enums
│
├── scripts/
│   ├── cloudinary-test.ts  # Cloudinary API test
│   └── sync/               # Sync workers
│
├── node_runtime/           # Bundled Node.js v20.18.0
├── turbo.json
├── tsconfig.json
├── package.json
└── .env.example
```

---

## 4. Tech Stack — Complete

### Frontend (`apps/frontend`)
| Technology | Version | Purpose |
|------------|---------|---------|
| Next.js | 15.0.0 | React framework (App Router) |
| React | 19.0.0 | UI library |
| TypeScript | ~5.4.0 | Type safety |
| Tailwind CSS | ^3.4.1 | Utility-first styling |
| TanStack Query | ^5.28.0 | Server state / caching |
| React Hook Form | ^7.51.0 | Form handling |
| Zod | ^3.23.0 | Schema validation |
| Axios | ^1.6.0 | HTTP client w/ interceptors |
| Lucide React | ^0.400.0 | Icons |

### Backend (`apps/backend`)
| Technology | Version | Purpose |
|------------|---------|---------|
| NestJS | ^10.3.0 | Node.js framework |
| TypeScript | ~5.4.0 | Language |
| Prisma Client | ^5.14.0 | ORM |
| Passport + JWT | latest | Auth (strategy + guards) |
| bcrypt | ^5.1.1 | Password hashing |
| BullMQ | ^5.7.0 | Async job queue |
| ioredis | ^5.4.0 | Redis client |
| Google APIs | ^137.0.0 | Google Sheets integration |
| class-validator | ^0.14.0 | DTO validation |
| @nestjs/swagger | ^7.3.0 | OpenAPI docs |

### Database & Infrastructure
| Component | Technology | Purpose |
|-----------|-----------|---------|
| Primary DB | PostgreSQL (Neon) | Source of truth |
| Queue/Cache | Redis (Upstash) | BullMQ backend |
| ORM | Prisma | Type-safe DB access |
| Media | Cloudinary | Image/file storage |
| Monorepo | Turborepo ^2.0.0 | Task orchestration |
| Package Manager | npm 10.8.2 (workspaces) | Dependencies |
| Runtime | Node.js >=20.x | Server |

---

## 5. Database Schema (15 Models + 4 Enums)

The complete schema is in `database/prisma/schema.prisma`.

### Entity Relationship

```
User ──┬── Task (as giver)
       ├── TaskRating (as rater)
       ├── BatchChangeLog (as changer)
       └── AuditLog (via actor references)

Employee ─┬── Task (as assignee)
          └── TaskRating (as rater)

Teacher ─── ClassSchedule

Batch ─┬── BatchSubject ─── Subject
       ├── Student
       ├── ClassSchedule
       └── BatchChangeLog

Student ─── BatchChangeLog

Admission (standalone)

Task ─┬── TaskCompletion
      └── TaskRating

SyncLog (standalone — tracks Google Sheets sync progress)
AuditLog (standalone — tracks all DB changes)
```

### Model Details

| # | Model | Table | Key Fields |
|---|-------|-------|------------|
| 1 | **User** | `users` | id, username, passwordHash, name, email, mobile, post, role (UserRole), isActive, refreshToken, lastLoginAt |
| 2 | **Employee** | `employees` | id, name, employeeId (unique), email, department, designation, phone |
| 3 | **Teacher** | `teachers` | id, name, teacherId (unique), email |
| 4 | **Subject** | `subjects` | id, name, code (unique), isActive |
| 5 | **Batch** | `batches` | id, name, classRoom, isActive |
| 6 | **BatchSubject** | `batch_subjects` | batchId + subjectId (unique compound) |
| 7 | **Student** | `students` | id, studentId (unique), studentName, fatherName, dob, mobileNumbers, email, batchId → Batch, status (StudentStatus), deletedAt |
| 8 | **BatchChangeLog** | `batch_change_logs` | studentId, studentName, previousBatch, newBatch, changedById → User |
| 9 | **Admission** | `admissions` | id, studentId, studentName, fatherName, ... (mirror of student fields), status (AdmissionStatus) |
| 10 | **ClassSchedule** | `class_schedules` | date (DateTime), batchName, subjectName, startTime, endTime, teacherName, teacherEmail |
| 11 | **Task** | `tasks` | id, token (unique), employeeId, employeeName, taskType, taskDetail, status (TaskStatus), giverId → User |
| 12 | **TaskCompletion** | `task_completions` | taskId → Task, completedAt, notes |
| 13 | **TaskRating** | `task_ratings` | taskId → Task, rating (int), raterId → User, notes |
| 14 | **AuditLog** | `audit_logs` | action, entity, entityId, oldValues (JSON), newValues (JSON), actorId |
| 15 | **SyncLog** | `sync_logs` | entityType, entityId, action (INSERT/UPDATE/DELETE), status (SyncStatus), retryCount, errorMessage, lastAttemptAt |

### Enums
- **UserRole**: `ADMIN`, `MANAGER`, `STAFF`, `TEACHER`
- **StudentStatus**: `ACTIVE`, `CANCELLED`, `GRADUATED`
- **AdmissionStatus**: `PENDING`, `ENROLLED`, `CANCELLED`, `DUPLICATE`
- **TaskStatus**: `PENDING` → `COMPLETED` → `RATED`
- **SyncStatus**: `PENDING`, `IN_PROGRESS`, `COMPLETED`, `FAILED`

### Soft Deletes
All major entities (students, batches, tasks, employees, teachers, subjects) use the `deletedAt: DateTime?` pattern for soft deletion.

---

## 6. Backend API — Complete Reference

### Global Configuration
| Setting | Value |
|---------|-------|
| Port | 3001 (configurable via `PORT` env) |
| Global prefix | `/api/v1` |
| CORS origin | `FRONTEND_URL` env (default: `http://localhost:3000`) |
| Swagger docs | `/api/docs` |
| Validation | Global `ValidationPipe` (whitelist + transform) |
| Rate limit | 100 requests / 60 seconds per IP |

### 6.1 Authentication (`/auth`)
| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/login` | POST | Public | Login → `{ user, tokens: { accessToken, refreshToken } }` |
| `/refresh` | POST | Public | Refresh access token |
| `/logout` | POST | JWT | Invalidate refresh token |
| `/profile` | GET | JWT | Current user profile |

**Security**: Passwords hashed with bcrypt. Access token: 15m expiry. Refresh token: 7d expiry (stored in DB). Token rotation on refresh.

### 6.2 Users (`/users`)
| Endpoint | Method | Roles |
|----------|--------|-------|
| `/users` | GET | ADMIN |
| `/users/:id` | GET | ADMIN |
| `/users` | POST | ADMIN |
| `/users/:id` | PUT | ADMIN |
| `/users/:id` | DELETE | ADMIN |

### 6.3 Students (`/students`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/students` | GET | Paginated list (search, batchId, status, sort) |
| `/students/:id` | GET | By UUID |
| `/students/studentId/:studentId` | GET | By studentId field |
| `/students` | POST | Create (duplicate check + sync queue) |
| `/students/:id` | PUT | Update (batch change logging + sync queue) |
| `/students/:id` | DELETE | Soft delete (sync queue) |
| `/students/sync-preview` | GET | Compare admissions ↔ students |
| `/students/duplicates` | GET | Duplicate detection by name/father/mobile |
| `/students/:id/batch-history` | GET | Batch change audit trail |
| `/students/batch-change` | POST | Change batch (creates BatchChangeLog) |

### 6.4 Admissions (`/students/admissions`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/students/admissions` | GET | List admissions |
| `/students/admissions/new-students` | GET | Admissions not yet in students table |
| `/students/admissions/sync-ids` | POST | Update student IDs from admissions |

### 6.5 Batches (`/batches`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/batches` | GET | All batches (with subjects + student count) |
| `/batches/:id` | GET | Single batch |
| `/batches/name/:name` | GET | By name |
| `/batches/names` | GET | Names only |
| `/batches` | POST | Create (with subjects) |
| `/batches/:id` | PUT | Update (subjects replaced transactionally) |
| `/batches/:id` | DELETE | Delete (handle existing students) |
| `/batches/:id/subjects` | POST | Add subject to batch |
| `/batches/:id/subjects/:subjectId` | DELETE | Remove subject |

### 6.6 Subjects (`/subjects`)
- Full CRUD with name, code (unique), isActive

### 6.7 Employees (`/employees`)
- Full CRUD with employeeId, department, designation, phone

### 6.8 Teachers (`/teachers`)
- Full CRUD with teacherId, email

### 6.9 Classes (`/classes`)
- CRUD with date, batchName, subjectName, startTime, endTime, teacher

### 6.10 Tasks (`/tasks`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/tasks` | GET | Paginated list (filter by status) |
| `/tasks` | POST | Create (auto token generation) |
| `/tasks/completed` | GET | Completed tasks pending rating |
| `/tasks/:id` | GET | By ID |
| `/tasks/token/:token` | GET | By token |
| `/tasks/:token/complete` | POST | Mark COMPLETED |
| `/tasks/:token/rate` | POST | Rate (only if COMPLETED) |
| `/tasks/:id` | PUT | Update |
| `/tasks/:id` | DELETE | Soft delete |

### 6.11 Sync (`/sync`)
| Endpoint | Method | Description |
|----------|--------|-------------|
| `/sync/process` | POST | Re-queue pending/failed syncs |
| `/sync/status` | GET | Queue status (pending/inProgress/completed/failed) |
| `/sync/logs` | GET | Recent sync log entries |

---

## 7. Sync Pipeline — Detailed Architecture

### 7.1 BullMQ Queue (`sync.queue.ts`)

| Property | Value |
|----------|-------|
| Queue name | `google-sheets-sync` |
| Max attempts | 5 |
| Backoff | Exponential: 2s → 4s → 8s → 16s → 32s |
| Concurrency | 3 workers |
| Rate limit | 10 jobs/second |
| Redis config | Host/port/password from env |

**Job Data**:
```typescript
interface SyncJobData {
  syncLogId: string;   // References SyncLog record
  entityType: string;   // "students" | "batches" | "tasks" | "employees" | "teachers" | "subjects"
  entityId: string;     // UUID in PostgreSQL
  action: 'INSERT' | 'UPDATE' | 'DELETE';
  retryAttempt: number;
}
```

### 7.2 Google Sheets Service (`google-sheets.service.ts`)

| Sheet | Environment Variable | Purpose |
|-------|---------------------|---------|
| Login/Task | `GOOGLE_LOGIN_SHEET_ID` | Auth + task data |
| Classes/Students | `GOOGLE_CLASSES_STUDENTS_SHEET_ID` | Batch, student, teacher, class data |
| Admissions | `GOOGLE_ADMISSIONS_SHEET_ID` | Admission applications |

**Operations**:
- `appendRow()`: Auto-create header row on first insert
- `updateRow()`: Find by first-column ID match and update in-place
- `deleteRow()`: Clear row content for deleted entities

**Authentication**: JWT with service account (`GOOGLE_SERVICE_ACCOUNT_EMAIL` + `GOOGLE_PRIVATE_KEY`)

### 7.3 Entity Data Mapping

When a sync job runs, the worker fetches the full entity from PostgreSQL and transforms it into key-value pairs matching the Google Sheets columns:

| Entity | Columns Pushed |
|--------|---------------|
| **students** | Student ID, Student Name, Father's Name, Mother's Name, DOB, Mobile Numbers, Email, Category, Class, Batch, Program, Status, Start Session, End Session |
| **batches** | Batch Name, Class Room, Subjects (CSV), Student Count, Active |
| **tasks** | Token, Employee, Task Type, Task Detail, Task Role, Ending Date, Status, Given By, Created |
| **employees** | Employee ID, Name, Email, Department, Designation, Phone |
| **teachers** | Teacher ID, Name, Email |
| **subjects** | Code, Name, Active |

---

## 8. Frontend Pages — Detailed

### 8.1 Page Structure

| Route | File | Data Source | Features |
|-------|------|-------------|----------|
| `/` | `page.tsx` | — | Redirects to `/dashboard` |
| `/auth/login` | `auth/login/page.tsx` | AuthContext + API | Login form, error state, loading state |
| `/dashboard` | `dashboard/page.tsx` | AuthContext | Navigation hub (11 buttons) |
| `/students` | `students/page.tsx` | `useStudents()` hook | List, search, paginate, active filter, sync status |
| `/tasks` | `tasks/page.tsx` | `useTasks()` hook | List, status filter, paginate, quick-create form |
| `/batches` | `batches/page.tsx` | `useBatches()` + `useSubjects()` | CRUD: add (3-step wizard), edit, delete, list |
| `/subjects` | `subjects/page.tsx` | `useSubjects()` hook | Add (auto code gen), list with active status |

### 8.2 Dashboard Buttons

| Button | Action |
|--------|--------|
| CLASSES MANAGE | Opens external Google Apps Script web app |
| HEADS MANAGE | Opens external Google Apps Script web app |
| TASK MANAGE | Navigates to `/tasks` |
| PERFORMANCE | Opens external Google Apps Script web app |
| EXAM SECTION | Opens external Google Apps Script web app |
| STUDENTS MANAGE | Navigates to `/students` |
| CLASSPLUS LOGIN | Opens ClassPlus in new window |
| FOR GRIEVANCE DEPARTMENT | Opens external Google Apps Script web app |
| JOB REQUIREMENT | Opens external Google Apps Script web app |
| DAILY ALERTS | Opens external Google Apps Script web app |
| Logout | Clears session, redirects to login |

### 8.3 State Management (TanStack Query)

17 custom hooks in `lib/hooks.ts`:

| Hook | Query Key | Stale Time |
|------|-----------|------------|
| `useStudents(params)` | `['students', params]` | 30s |
| `useStudent(id)` | `['students', id]` | — |
| `useCreateStudent()` | mutation → invalidates `students` | — |
| `useUpdateStudent()` | mutation → invalidates `students` | — |
| `useDeleteStudent()` | mutation → invalidates `students` | — |
| `useTasks(params)` | `['tasks', params]` | 15s |
| `useTask(id)` | `['tasks', id]` | — |
| `useCreateTask()` | mutation → invalidates `tasks` | — |
| `useCompleteTask()` | mutation → invalidates `tasks` | — |
| `useRateTask()` | mutation → invalidates `tasks` | — |
| `useBatches()` | `['batches']` | 60s |
| `useBatch(id)` | `['batches', id]` | — |
| `useCreateBatch()` | mutation → invalidates `batches` | — |
| `useUpdateBatch()` | mutation → invalidates `batches` | — |
| `useDeleteBatch()` | mutation → invalidates `batches` | — |
| `useSubjects()` | `['subjects']` | 60s |
| `useSyncStatus()` | `['sync', 'status']` | 10s (refetch 30s) |

### 8.4 UI States per Page

| State | Students | Tasks | Batches | Subjects |
|-------|----------|-------|---------|----------|
| **Loading** | Spinner + text | Large spinner | Spinner | Spinner |
| **Error** | Red card + retry | Red card + retry | Red card + retry | Red card + retry |
| **Empty** | "No students found" | "No tasks found" | "No batches found" | "No subjects found" |
| **Data** | Table + pagination | Card list + status badges | Card grid | Card list |
| **Mutation** | — | Form disabled + status | Save/Delete spinners | Button spinner |

---

## 9. Security

1. **JWT Access + Refresh Tokens** — Short-lived access tokens with rotating refresh tokens stored in DB
2. **bcrypt Password Hashing** — Cost factor 10 (default)
3. **RBAC** — 4 roles: ADMIN, MANAGER, STAFF, TEACHER (guards + decorators)
4. **Rate Limiting** — 100 requests / 60 seconds per IP (ThrottlerModule)
5. **Input Validation** — `ValidationPipe` with whitelist + transform
6. **CORS Restriction** — Only `FRONTEND_URL` origin allowed
7. **Soft Deletes** — `deletedAt` pattern prevents data loss
8. **Audit Logging** — All CRUD operations logged with old/new JSON diffs

---

## 10. Environment Configuration

| Variable | Description | Default |
|----------|-------------|---------|
| `DATABASE_URL` | PostgreSQL connection string | `postgresql://...` |
| `JWT_SECRET` | Access token signing key | *(required)* |
| `JWT_REFRESH_SECRET` | Refresh token signing key | *(required)* |
| `JWT_EXPIRATION` | Access token TTL | `15m` |
| `JWT_REFRESH_EXPIRATION` | Refresh token TTL | `7d` |
| `REDIS_HOST` | Redis host | `localhost` |
| `REDIS_PORT` | Redis port | `6379` |
| `REDIS_PASSWORD` | Redis password | *(empty)* |
| `GOOGLE_SERVICE_ACCOUNT_EMAIL` | GCP service account email | *(required for sync)* |
| `GOOGLE_PRIVATE_KEY` | Service account private key | *(required for sync)* |
| `GOOGLE_LOGIN_SHEET_ID` | Sheet ID (auth + tasks) | *(required for sync)* |
| `GOOGLE_CLASSES_STUDENTS_SHEET_ID` | Sheet ID (classes/students/batches) | *(required for sync)* |
| `GOOGLE_ADMISSIONS_SHEET_ID` | Sheet ID (admissions) | *(required for sync)* |
| `CLOUDINARY_CLOUD_NAME` | Cloudinary cloud name | *(optional)* |
| `CLOUDINARY_API_KEY` | Cloudinary API key | *(optional)* |
| `CLOUDINARY_API_SECRET` | Cloudinary API secret | *(optional)* |
| `PORT` | Backend port | `3001` |
| `FRONTEND_URL` | CORS origin | `http://localhost:3000` |

---

## 11. Key Business Logic

### Student Lifecycle
```
Admission (PENDING) → Student (ACTIVE) → Batch Assignment
                                       → Batch Changes (logged in BatchChangeLog)
                                       → Cancellation (soft delete, status = CANCELLED)
                                       → Graduation (status = GRADUATED)
```

### Task Workflow
```
Task Created (PENDING) → Employee Completes (COMPLETED)
                       → Manager Rates (RATED) [terminal state]
```
Tasks have unique 8-char hex token for easy reference. Validation: cannot rate unless COMPLETED.

### Duplicate Detection
Students are flagged as duplicates when `studentName + fatherName + mobileNumbers` match across multiple records.

### Sync Pipeline
Every CRUD operation on students, batches, tasks, employees, teachers, subjects triggers:
1. `SyncService.queueSync()` → creates SyncLog (PENDING)
2. BullMQ enqueue → worker processes async
3. Worker fetches full entity from PostgreSQL → pushes to Google Sheets
4. SyncLog updated to COMPLETED (or FAILED with retry)

---

## 12. Deployment Architecture

| Component | Platform | Notes |
|-----------|----------|-------|
| Frontend | Vercel | Next.js 15, serverless |
| Backend | Railway / Render | NestJS, Node >=20 |
| Database | Neon (PostgreSQL) | Serverless Postgres |
| Redis/Cache | Upstash | Serverless Redis |
| Media Storage | Cloudinary | Image uploads |
| Reporting | Google Sheets | Async via BullMQ |
| External Apps | Google Apps Script | Classes, Heads, Performance, etc. |

---

## 13. Scripts & Utilities

### Root Scripts
| Script | Description |
|--------|-------------|
| `npm run dev` | Start all apps (turbo) |
| `npm run build` | Build all apps |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:push` | Push schema to DB |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:studio` | Open Prisma Studio |
| `npm run frontend:dev` | Next.js dev server |
| `npm run backend:dev` | NestJS dev server |

### Batch Files (Windows)
| File | Purpose |
|------|---------|
| `start-backend.bat` | Start NestJS backend |
| `push-db.bat` | Push schema to DB |
| `install-all.bat` | Install all dependencies |
| `setup-all.bat` | Full setup |
| `setup-env.bat` | Environment config |
| `run-cloudinary-test.bat` | Test Cloudinary connection |

---

## 14. Development Setup

### Prerequisites
- Node.js >= 20.x
- PostgreSQL database
- Redis instance
- Google Cloud service account (for sync)

### Quick Start
```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Generate Prisma client + push schema
npm run db:generate
npm run db:push

# Start development servers
npm run dev
```

---

## 15. Summary

| Component | Source Files | Lines (approx) |
|-----------|-------------|----------------|
| Prisma Schema | 1 | 450+ |
| Backend (NestJS) | ~45 TypeScript | 4,000+ |
| Frontend (Next.js) | ~15 TSX/TS | 1,500+ |
| Shared Packages | 4 | 350+ |
| Scripts | 5+ | 300+ |
| Config files | 10+ | 250+ |
| **TOTAL** | **~80 files** | **~7,000+ lines** |

### Migration Status (Google Apps Script → Modern Stack)

| Feature | Status | Details |
|---------|--------|---------|
| Authentication (Login) | ✅ Complete | JWT-based with session persistence |
| Student Management | ✅ Complete | CRUD, batch change, duplicate detection |
| Batch Management | ✅ Complete | CRUD with subject mapping |
| Subject Management | ✅ Complete | CRUD with auto code generation |
| Task Management | ✅ Complete | Full workflow (PENDING→COMPLETED→RATED) |
| Employee & Teacher Mgmt | ✅ Complete | CRUD with relation mapping |
| Class Scheduling | ✅ Complete | CRUD with date/time tracking |
| Google Sheets Sync | ✅ Complete | BullMQ queue + worker + sheets API |
| Background Jobs | ✅ Complete | BullMQ with exponential backoff |
| TanStack Query Integration | ✅ Complete | 17 hooks with cache invalidation |
| Error/Loading/Empty States | ✅ Complete | All pages handle all states |
| Prisma Optimization | ✅ Complete | Explicit selects, no N+1 |

*Report compiled from full project source analysis — July 2026*