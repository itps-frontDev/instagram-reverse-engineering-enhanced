# Copilot Instructions for this Repository

## Build, test, and lint commands

Run commands from the service directory shown below.

| Area | Command | Notes |
| --- | --- | --- |
| Frontend (Next.js) | `cd frontend && pnpm install` | Install JS dependencies |
| Frontend (dev) | `cd frontend && pnpm dev` | Starts app on port 3000 |
| Frontend (build) | `cd frontend && pnpm build` | Production build |
| Frontend (lint) | `cd frontend && pnpm lint` | ESLint (`eslint.config.mjs`) |
| Frontend (DB migrate) | `cd frontend && pnpm db:migrate` | Applies schema script |
| Frontend (DB reset) | `cd frontend && pnpm db:reset` | Recreates DB state |
| Frontend (DB seed) | `cd frontend && pnpm db:seed` | Populates demo dataset |
| Backend (dev) | `cd backend && .\gradlew.bat bootRun` | Spring Boot app (port 8080) |
| Backend (build) | `cd backend && .\gradlew.bat build` | Gradle build |
| Backend (test all) | `cd backend && .\gradlew.bat test` | JUnit suite |
| Backend (single test) | `cd backend && .\gradlew.bat test --tests "it.evodev.instagram.InstagramApplicationTests.contextLoads"` | Example targeted test run |

## High-level architecture

- Monorepo with two apps: `frontend/` (Next.js App Router) and `backend/` (Spring Boot). Docker Compose wires frontend + backend + PostgreSQL + Redis (+ Azurite in dev override).
- Current feature implementation is primarily in `frontend/`: UI pages and API route handlers live together under `src/app`, and route handlers call repository modules directly.
- Data access path in frontend is:
  `route.ts` (API handlers) → `src/repositories/*Repository.ts` → `src/lib/db.ts`.
- `src/lib/db.ts` uses `pg` + connection pool + `AsyncLocalStorage` transaction context; repositories keep `?` placeholders and the DB layer maps them to PostgreSQL positional params.
- Auth is cookie-based JWT:
  login/register handlers set/read `authToken`, server-side auth helpers in `src/lib/auth.ts`, and client auth state is provided via `AuthContext`.
- Media files are stored on local disk (`frontend/data/uploads`) and always served through `/api/media/[...path]`, where access control is enforced against DB state before file bytes are returned.
- Backend currently contains platform setup (Spring Security/JPA/Liquibase config and migrations) with minimal Java application logic; verify ownership before implementing domain features there vs in Next.js API routes.

## Key conventions in this codebase

- **Always use repository modules for DB access** from API routes (`@/repositories` barrel), not ad-hoc SQL in handlers unless matching an existing pattern.
- **Use `withTransaction(...)` for multi-step writes** that must succeed/fail atomically (e.g., register flow, post creation + media + counter updates).
- **Soft delete is the default data lifecycle**: entities commonly use `deleted_at`; active-record queries should explicitly filter on `deleted_at IS NULL`.
- **Normalize identity fields to lowercase** before persistence/lookup (email, username, phone where applicable) to avoid case-variant duplicates.
- **For Next.js API handlers touching Node-only APIs** (bcrypt, filesystem, DB driver behavior), keep `export const runtime = 'nodejs'`.
- **Boolean normalization is defensive in repositories** (`Boolean(...)`) for fields returned through DB/subquery combinations.
- **Follow App Router grouping layout**: authenticated UI under `src/app/(main)` and auth screens under `src/app/(auth)`, with shared auth state injected by `src/components/Providers.tsx`.
