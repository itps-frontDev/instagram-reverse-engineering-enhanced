# Repository Guide for OpenCode

## What runs where
- Monorepo: `frontend/` (Next.js 16 App Router + API routes) and `backend/` (Spring Boot, Java 21). Main entrypoints: `frontend/src/app/(main)/page.tsx`, `frontend/src/app/(auth)/`, and `backend/src/main/java/it/evodev/instagram/InstagramApplication.java`.
- Primary feature logic currently lives in Next.js API routes; backend is mostly platform setup. Verify ownership before adding domain logic to Java.

## Commands that matter
- Frontend (from `frontend/`): `pnpm dev`, `pnpm build`, `pnpm lint`, `pnpm test`, `pnpm db:migrate`, `pnpm db:reset`, `pnpm db:seed`.
- Backend (from `backend/`): `./gradlew bootRun`, `./gradlew build`, `./gradlew test`, single test: `./gradlew test --tests "it.evodev.instagram.InstagramApplicationTests.contextLoads"`.

## Docker/dev env gotchas
- Root `docker-compose.yml` + `docker-compose.override.yml`; requires root `.env` (see `.env.example`). Services: frontend 3000, backend 8080, Postgres 16, Redis, Azurite (dev override only).
- Dev override sets `WATCHPACK_POLLING=true` for Next.js hot reload on Windows/WSL; backend debug port 5005 exposed.
- Azure Blob connection string is required even in dev; override swaps to Azurite values.

## Frontend data access conventions (don’t guess)
- API handlers → `frontend/src/repositories/*Repository.ts` → `frontend/src/lib/db.ts` (AsyncLocalStorage + pooled `pg`).
- Repositories use `?` placeholders; `frontend/src/lib/db.ts` maps them to PostgreSQL `$1...`.
- Use `withTransaction(...)` for multi-step writes; insert statements needing IDs must include `RETURNING id`.
- Soft delete is default (`deleted_at IS NULL`); normalize identity fields to lowercase (email/username/phone).
- For Node-only APIs (bcrypt, filesystem, pg), keep `export const runtime = 'nodejs'` in route handlers.
- Media files live under `frontend/data/uploads` and are served via `/api/media/[...path]` with DB-backed access checks.

## Auth flow
- Cookie-based JWT in Next.js: `AUTH_COOKIE_NAME` is `iree_access_token`; `frontend/src/lib/auth.ts` falls back to `authToken` and can call backend `/api/v1/auth/me` when local token is missing.

## Key instruction sources
- Repo-specific tooling/architecture notes also live in `.github/copilot-instructions.md`.
