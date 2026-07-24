# Collaborative Notes App — Claude Code Instructions

This is the documentation hub. **Start here**, then follow the routing table to the right doc for your task. When you work under `backend/` or `frontend/`, that folder's own `CLAUDE.md` also applies.

## Project Overview

A single-page notes app: create, edit, color, search, drag-reorder, and delete notes. Its defining feature is **graceful handling of concurrent edits** — a second save to a stale note gets a `409 Conflict` carrying the current server state, and the UI opens a side-by-side "your changes vs. server version" resolution dialog. This is conflict *detection + manual resolution*, not real-time collaboration.

Monorepo: a **NestJS + PostgreSQL** REST backend and a **React + Vite** SPA, wired together with Docker Compose (and, in production, nginx). Full context: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md).

## Critical Rules

- **ALWAYS read the relevant doc before implementing** (use the routing table below). Don't improvise architecture.
- **NEVER add npm dependencies** (backend or frontend) without asking first. Adding a shadcn/ui primitive via `npx shadcn add` is fine; anything else, confirm.
- **NEVER modify** `docker-compose*.yml`, the `Dockerfile`s, nginx configs, `.github/workflows/`, or the repository ruleset unless explicitly asked — these gate everyone's builds and merges.
- **ALWAYS follow existing patterns.** This is a small, consistent codebase — match it.
- **ALWAYS ship tests with code changes** and keep coverage **≥70%** — the ruleset enforces it on every PR. Run `npm run test:cov` in the affected package before opening a PR. See [docs/guides/TESTING.md](docs/guides/TESTING.md).
- **Preserve the optimistic-locking / conflict contract.** The `409` body shape `{ message, currentNote }` and the `expectedUpdatedAt` field are a contract between backend and frontend — change both sides together or neither.
- **Backend:** thin controllers, logic in services, DTO-validated bodies, throw NestJS exceptions, UUID+timestamps on entities, register new entities in two places. See [backend/CLAUDE.md](backend/CLAUDE.md).
- **Frontend:** all API calls through `src/api/`, local state only, toasts for errors, semantic Tailwind tokens + `cn()`, `.dark`-class dark mode. See [frontend/CLAUDE.md](frontend/CLAUDE.md).
- **Schema is `synchronize: true`** — no migrations; schema changes need a backend restart. Not production-safe ([docs/DATA_MODEL.md](docs/DATA_MODEL.md)).
- **ALWAYS keep docs in sync** with code — see [Keeping Docs in Sync](#keeping-docs-in-sync).

## Skills (Slash Commands)

Custom skills in `.claude/skills/`:

| Command | When to use |
|---------|-------------|
| `/design` | **Before building a feature.** Produce a structured plan (data model → API → UI) grounded in these docs, before writing code. |
| `/review` | **Before opening a PR.** Check docs-sync, DTO validation, error handling, the conflict contract, styling/accessibility, and the no-new-deps rule. |
| `/explain` | **To understand code.** Plain-English explanation of a file, flow, or the architecture, with pointers into these docs. |

## Before You Start Any Task

1. Read [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for system context.
2. Read [docs/CONVENTIONS.md](docs/CONVENTIONS.md) for coding standards.
3. Read the relevant area/guide doc from the table below.

## Quick Reference — Which Doc to Read

| Task | Read first |
|------|------------|
| New feature (end-to-end) | [docs/guides/ADD_FEATURE.md](docs/guides/ADD_FEATURE.md) |
| New API endpoint | [docs/guides/ADD_ENDPOINT.md](docs/guides/ADD_ENDPOINT.md) |
| New entity / DB table | [docs/guides/ADD_ENTITY.md](docs/guides/ADD_ENTITY.md) |
| New frontend page | [docs/guides/ADD_PAGE.md](docs/guides/ADD_PAGE.md) |
| New component | [docs/guides/ADD_COMPONENT.md](docs/guides/ADD_COMPONENT.md) |
| New custom hook | [docs/guides/ADD_HOOK.md](docs/guides/ADD_HOOK.md) |
| Backend module/controller work | [docs/backend/MODULES.md](docs/backend/MODULES.md) |
| Backend business logic | [docs/backend/SERVICES.md](docs/backend/SERVICES.md) |
| Entities / TypeORM | [docs/backend/ENTITIES.md](docs/backend/ENTITIES.md) |
| DTOs / validation | [docs/backend/DTOS_VALIDATION.md](docs/backend/DTOS_VALIDATION.md) |
| Backend errors / exceptions | [docs/backend/ERROR_HANDLING.md](docs/backend/ERROR_HANDLING.md) |
| Frontend components / shadcn | [docs/frontend/COMPONENTS.md](docs/frontend/COMPONENTS.md) |
| API client / data fetching | [docs/frontend/API_CLIENT.md](docs/frontend/API_CLIENT.md) |
| State, autosave, conflict flow | [docs/frontend/STATE_MANAGEMENT.md](docs/frontend/STATE_MANAGEMENT.md) |
| Styling / Tailwind / dark mode | [docs/frontend/STYLING.md](docs/frontend/STYLING.md) |
| Custom hooks | [docs/frontend/HOOKS.md](docs/frontend/HOOKS.md) |
| Database schema | [docs/DATA_MODEL.md](docs/DATA_MODEL.md) |
| API endpoint catalog | [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) |
| Environment variables | [docs/ENV_VARS.md](docs/ENV_VARS.md) |
| Writing / running tests | [docs/guides/TESTING.md](docs/guides/TESTING.md) |
| CI/CD pipelines & workflows | [docs/platform/CI_CD.md](docs/platform/CI_CD.md) |
| Branch protection / ruleset / coverage gate | [docs/platform/BRANCH_PROTECTION.md](docs/platform/BRANCH_PROTECTION.md) |
| Running / Docker | [docs/platform/DOCKER.md](docs/platform/DOCKER.md) |
| Nginx / reverse proxy | [docs/platform/NGINX.md](docs/platform/NGINX.md) |
| Deployment | [docs/platform/DEPLOYMENT.md](docs/platform/DEPLOYMENT.md) |
| Deploy via OIDC → AWS (stubbed) | [docs/platform/OIDC_DEPLOY.md](docs/platform/OIDC_DEPLOY.md) |
| Debugging | [docs/guides/DEBUGGING.md](docs/guides/DEBUGGING.md) |
| Security posture & gaps | [docs/guides/SECURITY.md](docs/guides/SECURITY.md) |
| Submitting a PR | [docs/guides/SUBMITTING_PR.md](docs/guides/SUBMITTING_PR.md) |

## Tech Stack

### Backend
- **NestJS 11** + TypeScript 5.9 (CommonJS)
- **TypeORM 0.3** + **PostgreSQL 16** (`synchronize: true`, no migrations)
- **`class-validator`/`class-transformer`** via global `ValidationPipe`
- **`@nestjs/config`** for env; Node 20, run via `ts-node`/`nodemon` (no Nest CLI)

### Frontend
- **React 19** + TypeScript 5.9 + **Vite 7**
- **React Router v7**, **Tailwind CSS v4** (CSS-first) + **shadcn/ui** (new-york)
- **Framer Motion**, **dnd-kit**, **lucide-react**, **sonner**, **react-markdown**, **date-fns**
- `fetch`-based API client; **local component state only** (no store, no React Query)

### Infrastructure
- **Docker Compose** — dev (`docker-compose.dev.yml`) and prod (`docker-compose.yml`)
- **nginx** — prod only: SPA static server (`:80`) + API reverse proxy (`:3000`)

### Testing & CI
- **Backend:** Jest + supertest — unit + in-memory-SQLite E2E (~89% coverage)
- **Frontend:** Vitest + Testing Library — unit/component/page (~91% coverage)
- **E2E:** Playwright (full-stack, in `e2e/`) — smoke on PRs, full suite on push
- **CI/CD:** GitHub Actions (frontend-ci, backend-ci, e2e, security-scan, deploy), gated by a ruleset requiring **1 review + ≥70% coverage + code quality**. See [docs/platform/CI_CD.md](docs/platform/CI_CD.md) and [docs/platform/BRANCH_PROTECTION.md](docs/platform/BRANCH_PROTECTION.md).

Details & exact versions: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [backend/CLAUDE.md](backend/CLAUDE.md), [frontend/CLAUDE.md](frontend/CLAUDE.md).

## Running the App

```bash
# Development (hot reload) — preferred
docker compose -f docker-compose.dev.yml up --build
#   frontend  http://localhost:5173
#   backend   http://localhost:3000
#   postgres  localhost:5432  (postgres/postgres, db "notes")

# Production stack
docker compose up --build
#   app  http://localhost:80   ·   API http://localhost:3000 (reverse proxy)
```

Full setup and commands: [docs/platform/DOCKER.md](docs/platform/DOCKER.md).

### Tests

```bash
cd backend  && npm run test:cov     # Jest (unit + E2E), coverage
cd frontend && npm run test:cov     # Vitest (unit/component/page), coverage
# Full-stack E2E (stack must be running):
cd e2e && npm ci && npm run install:browsers && npm test
```

See [docs/guides/TESTING.md](docs/guides/TESTING.md).

## Project Structure

```
notes_interview_app/
├── CLAUDE.md                      # ← you are here (hub)
├── docs/                          # All documentation (routing table maps tasks → docs)
│   ├── ARCHITECTURE.md  CONVENTIONS.md  DATA_MODEL.md  API_CONTRACTS.md  ENV_VARS.md
│   ├── backend/    STRUCTURE · MODULES · SERVICES · ENTITIES · DTOS_VALIDATION · ERROR_HANDLING
│   ├── frontend/   STRUCTURE · COMPONENTS · API_CLIENT · HOOKS · STATE_MANAGEMENT · STYLING
│   ├── guides/     ADD_FEATURE · ADD_ENDPOINT · ADD_ENTITY · ADD_PAGE · ADD_COMPONENT · ADD_HOOK
│   │               · TESTING · DEBUGGING · SECURITY · SUBMITTING_PR
│   └── platform/   DOCKER · NGINX · DEPLOYMENT · CI_CD · BRANCH_PROTECTION · OIDC_DEPLOY
├── .github/workflows/             # CI/CD: frontend-ci · backend-ci · e2e · security-scan · deploy
├── backend/                       # NestJS API — see backend/CLAUDE.md
│   ├── CLAUDE.md · jest.config.js
│   ├── src/    main.ts · app.module.ts · notes/{controller,service,module,dto,entities} + *.spec.ts
│   └── test/   *.e2e-spec.ts (e2e · regression · smoke) + utils/create-test-app.ts
├── frontend/                      # React SPA — see frontend/CLAUDE.md
│   ├── CLAUDE.md
│   └── src/  main.tsx · App.tsx · api/ · types/ · lib/ · hooks/ · pages/ · components/{,ui} + *.test.tsx · test/setup.ts
├── e2e/                           # Playwright full-stack tests (smoke · notes-crud · conflict)
├── nginx/nginx.conf               # Prod reverse proxy (:3000 → backend)
├── research/                      # Original planning notes — historical/aspirational (see note below)
├── docker-compose.yml             # Prod stack
├── docker-compose.dev.yml         # Dev stack
├── .env.example
└── .claude/skills/                # /design, /review, /explain
```

### Key Directories

- **`docs/`** — the knowledge base. The routing table above maps each task to the right doc.
- **`backend/`** — NestJS project. Folder rules: [backend/CLAUDE.md](backend/CLAUDE.md).
- **`frontend/`** — React project. Folder rules: [frontend/CLAUDE.md](frontend/CLAUDE.md).
- **`research/`** — the original planning notes. Treat as **historical/aspirational**: some of it (React 18, migrations) does not match the current code. Its 70% test-coverage goal is now real and enforced ([docs/platform/BRANCH_PROTECTION.md](docs/platform/BRANCH_PROTECTION.md)). **These docs, not `research/`, are ground truth.**
- **`.claude/`** — Claude Code config: custom skills. Each package also has a descriptive `.claude/settings.json` (metadata only).

## Keeping Docs in Sync

When you change code, update the doc that describes it — PMs and future contributors rely on these being accurate.

### Backend changes

| What changed | Update |
|--------------|--------|
| New/changed endpoint or request/response shape | [docs/API_CONTRACTS.md](docs/API_CONTRACTS.md) |
| New/changed entity or column | [docs/DATA_MODEL.md](docs/DATA_MODEL.md) **and** the frontend mirror type in `frontend/src/types/` |
| New module/app | [docs/backend/STRUCTURE.md](docs/backend/STRUCTURE.md), [backend/CLAUDE.md](backend/CLAUDE.md) tree |
| New env variable | [docs/ENV_VARS.md](docs/ENV_VARS.md), `.env.example`, compose files |
| New service pattern | [docs/backend/SERVICES.md](docs/backend/SERVICES.md) |

### Frontend changes

| What changed | Update |
|--------------|--------|
| New page + route | [docs/frontend/STRUCTURE.md](docs/frontend/STRUCTURE.md), [frontend/CLAUDE.md](frontend/CLAUDE.md) tree |
| New `ui/` primitive | [docs/frontend/COMPONENTS.md](docs/frontend/COMPONENTS.md) |
| New feature component | [frontend/CLAUDE.md](frontend/CLAUDE.md) tree |
| New hook | [docs/frontend/HOOKS.md](docs/frontend/HOOKS.md) |
| New API function | [docs/frontend/API_CLIENT.md](docs/frontend/API_CLIENT.md) |
| Theme/token change | [docs/frontend/STYLING.md](docs/frontend/STYLING.md) |

### Tests & CI

| What changed | Update |
|--------------|--------|
| Any code change | Add/adjust tests; keep coverage ≥70% ([docs/guides/TESTING.md](docs/guides/TESTING.md)) |
| New user-facing flow | Add/extend a Playwright spec in `e2e/` |
| A CI workflow | [docs/platform/CI_CD.md](docs/platform/CI_CD.md) |
| The repository ruleset | [docs/platform/BRANCH_PROTECTION.md](docs/platform/BRANCH_PROTECTION.md) |

### Rule

If you're unsure whether a doc needs updating, check the routing table. If your change touches a listed area, read that doc and verify it still matches the code. When you establish a genuinely new pattern, document it as an example in the matching doc.
