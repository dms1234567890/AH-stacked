# Prime Academic Manager ERP

Production-grade SaaS architecture migrated from Google Apps Script to modern stack.

## Architecture

```
Frontend (Next.js 15)  →  Backend (NestJS)  →  PostgreSQL (Source of Truth)
                                                       ↓
                                                  BullMQ Queue
                                                       ↓
                                                  Google Sheets (Reporting)
```

## Tech Stack

### Frontend
- Next.js 15, React 19, TypeScript
- TailwindCSS, TanStack Query, React Hook Form, Zod

### Backend
- NestJS, TypeScript, Prisma ORM
- JWT + Refresh Tokens, RBAC
- BullMQ, Redis, Google Sheets Sync

### Database
- PostgreSQL - Primary
- Google Sheets - Secondary/Reporting

## Project Structure

```
/apps
  /frontend     → Next.js app
  /backend      → NestJS API
/packages
  /types        → Shared TypeScript interfaces
  /shared       → Shared Zod schemas
/database
  /prisma       → Prisma schema + migrations
/scripts
  /sync         → Google Sheets sync workers
  /migration    → Data migration scripts
```

## Getting Started

### Prerequisites
- Node.js >= 20.x
- PostgreSQL database (local Docker PostgreSQL, Neon, or Supabase)
- Redis (Upstash recommended)
- Google Service Account credentials

### Installation

```bash
# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env with your database URL and secrets

# Option A: start the persistent local PostgreSQL service
npm run db:local:up

# Verify the configured database before changing its schema
npm run db:check

# Generate Prisma client
npm run db:generate

# Run database migrations
npm run db:migrate

# Start development
npm run dev
```

## Database Hosting

The backend accepts any standard PostgreSQL connection string through `DATABASE_URL`; no schema or application code changes are needed to use Neon, Supabase, or the local service in `compose.yml`.

- **Local persistent PostgreSQL:** Run `npm run db:local:up`. Its data is stored in the named Docker volume and it restarts automatically while Docker Desktop is running. This is the most reliable development option and never auto-suspends.
- **Always-on hosted PostgreSQL:** Use Supabase Pro or Neon Launch with Scale to Zero disabled. Both are paid options for production workloads that must remain active.
- **Free hosted PostgreSQL:** Supabase Free pauses after roughly a week of low activity; Neon Free scales to zero after five minutes. Neither free tier is an always-on production database.

To use a hosted provider, replace only `DATABASE_URL` in `.env`, then run `npm run db:check`, `npm run db:generate`, and `npm run db:push`. For a Neon connection that only has cold-start timeouts, add `connect_timeout=20&pool_timeout=20` to its URL.

## Modules

1. **Authentication** - JWT + Refresh Tokens + RBAC
2. **Students** - CRUD, enrollment, batch changes, sync
3. **Employees** - Employee management
4. **Teachers** - Teacher management
5. **Subjects** - Subject CRUD
6. **Batches** - Batch management with subjects
7. **Classes** - Class schedules
8. **Tasks** - Task assignment and rating
9. **Sync** - Background Google Sheets synchronization

## API Documentation

Once running, visit:
- Swagger: `http://localhost:3001/api/docs`

## Deployment

- **Frontend**: Vercel
- **Backend**: Railway
- **Database**: Managed PostgreSQL (Neon or Supabase)
- **Redis**: Upstash
- **Cache**: Redis

## Migration Notes

- All existing Google Apps Script functions have been mapped to NestJS services
- Google Sheets remain as a reporting layer only
- PostgreSQL is the single source of truth
- All writes are queued for background sync to Google Sheets
- User never waits for Google Sheets operations

## License

Private - Prime Academic Institute
