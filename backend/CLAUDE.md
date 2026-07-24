# Backend — Claude Code Instructions

NestJS REST API for the Collaborative Notes App. Read this before working anywhere under `backend/`. Cross-cutting context is in the root [CLAUDE.md](../CLAUDE.md); deep dives are in [docs/backend/](../docs/backend/).

## Tech Stack

- **Framework:** NestJS 11 (`@nestjs/common`, `@nestjs/core`, `@nestjs/platform-express`)
- **Language:** TypeScript 5.9 (CommonJS, `experimentalDecorators` + `emitDecoratorMetadata`)
- **Database:** PostgreSQL 16
- **ORM:** TypeORM 0.3 via `@nestjs/typeorm`
- **Config:** `@nestjs/config` (`ConfigService`, global)
- **Validation:** `class-validator` + `class-transformer` via a global `ValidationPipe`
- **Runtime:** Node 20; run with `ts-node`/`nodemon` (dev) or compiled `dist/` (prod). **No Nest CLI / no `nest-cli.json`.**
- **Tests:** Jest + supertest — unit specs (`src/**/*.spec.ts`) + in-memory-SQLite E2E/regression/smoke (`test/`); ~89% coverage, gated at 70%. See [docs/guides/TESTING.md](../docs/guides/TESTING.md).

## Critical Rules

- **Do not add npm dependencies** without asking first.
- **Do not modify** `Dockerfile`, `docker-compose*.yml`, nginx configs, or `.github/workflows/` unless explicitly asked.
- **Controllers stay thin** — routing + `@Body`/`@Param` binding only. All logic lives in services. See [docs/backend/MODULES.md](../docs/backend/MODULES.md).
- **Every request body is a DTO** validated by `class-validator`. Never read raw `@Body()` objects. See [docs/backend/DTOS_VALIDATION.md](../docs/backend/DTOS_VALIDATION.md).
- **Throw NestJS exceptions** (`NotFoundException`, `ConflictException`, …) for error cases — never return error objects. See [docs/backend/ERROR_HANDLING.md](../docs/backend/ERROR_HANDLING.md).
- **Every entity:** UUID PK, `@CreateDateColumn`/`@UpdateDateColumn`, explicit column `type`/`default`. Register new entities in **both** `entities: [...]` (`app.module.ts`) and `TypeOrmModule.forFeature([...])`. See [docs/backend/ENTITIES.md](../docs/backend/ENTITIES.md).
- **The 409 conflict body shape** (`{ message, currentNote }`) is a contract the frontend depends on — don't change it without updating the client.
- **Preserve the optimistic-locking behavior** on `PUT /notes/:id` (compare `updatedAt` vs. `expectedUpdatedAt`).
- **Schema is `synchronize: true`** — no migrations. A schema change needs a backend **restart**, not a migration. (Not production-safe — see [docs/DATA_MODEL.md](../docs/DATA_MODEL.md).)
- **Parameterize all query-builder input** (`:param`) — never concatenate.
- **Ship tests with every change:** a unit spec (mock the repo via `getRepositoryToken(Note)`) for new service/controller logic, plus an assertion in `test/notes.e2e-spec.ts`; add a contract to `test/regression.e2e-spec.ts` for documented invariants. Keep coverage ≥70% (`npm run test:cov`). See [docs/guides/TESTING.md](../docs/guides/TESTING.md).
- **Update docs** when you change endpoints ([docs/API_CONTRACTS.md](../docs/API_CONTRACTS.md)), the schema ([docs/DATA_MODEL.md](../docs/DATA_MODEL.md)), env vars ([docs/ENV_VARS.md](../docs/ENV_VARS.md)), or this file's tree.

## Directory Structure

```
backend/
├── src/
│   ├── main.ts              # Bootstrap: CORS allow-list, global ValidationPipe, listen(3000)
│   ├── app.module.ts        # ConfigModule + TypeOrmModule.forRootAsync + NotesModule; entities: [Note]
│   └── notes/               # The one feature module
│       ├── notes.module.ts       # TypeOrmModule.forFeature([Note]) + controller + service
│       ├── notes.controller.ts   # @Controller('notes') — GET/POST/PUT/PATCH(reorder)/DELETE
│       ├── notes.service.ts       # Business logic: ordering, optimistic locking, reorder
│       ├── dto/
│       │   ├── create-note.dto.ts    # CreateNoteDto (title required)
│       │   ├── update-note.dto.ts    # UpdateNoteDto (+ required expectedUpdatedAt)
│       │   └── reorder-notes.dto.ts  # ReorderNotesDto ({ noteIds: string[] })
│       ├── entities/
│       │   └── note.entity.ts     # @Entity('notes'); NoteColor union; version col (unused for locking)
│       ├── notes.service.spec.ts     # unit tests (mocked repository)
│       └── notes.controller.spec.ts  # unit tests (mocked service)
├── test/                    # Jest E2E over in-memory SQLite (supertest)
│   ├── notes.e2e-spec.ts    # CRUD journeys
│   ├── regression.e2e-spec.ts  # documented invariants (409 shape, position, whitelist, 204…)
│   ├── smoke.e2e-spec.ts    # boots + GET /notes → 200
│   └── utils/create-test-app.ts
├── jest.config.js           # unit + E2E; 70% coverage threshold; Cobertura output
├── Dockerfile               # Multi-stage: development / build / production (node:20-alpine)
├── tsconfig.json            # CommonJS, ES2021, decorators (excludes tests from the build)
└── package.json             # start / build / test / test:unit / test:e2e / test:cov
```

## Commands

```bash
# From the dev stack (preferred — see root CLAUDE.md):
docker compose -f docker-compose.dev.yml up backend

# Locally inside backend/:
npm run start:dev        # nodemon + ts-node, hot reload
npm run build            # tsc -> dist/
npx tsc --noEmit         # type-check only
npm test                 # all Jest tests (unit + E2E)
npm run test:cov         # + coverage (fails under 70%)
```

## Environment Variables

All read via `ConfigService` with inline defaults (boots with none set): `DB_HOST`, `DB_PORT`, `DB_USERNAME`, `DB_PASSWORD`, `DB_DATABASE`, `DB_SYNCHRONIZE`. The HTTP port is hardcoded `3000` in `main.ts` (not env-driven). Full reference: [docs/ENV_VARS.md](../docs/ENV_VARS.md).

## Deeper Docs

- [docs/backend/STRUCTURE.md](../docs/backend/STRUCTURE.md) — layout, bootstrap, root module
- [docs/backend/MODULES.md](../docs/backend/MODULES.md) — modules & controllers
- [docs/backend/SERVICES.md](../docs/backend/SERVICES.md) — service patterns (locking, reorder, repository)
- [docs/backend/ENTITIES.md](../docs/backend/ENTITIES.md) — TypeORM entities & registration
- [docs/backend/DTOS_VALIDATION.md](../docs/backend/DTOS_VALIDATION.md) — DTOs & validation
- [docs/backend/ERROR_HANDLING.md](../docs/backend/ERROR_HANDLING.md) — exceptions & error shapes
- [docs/API_CONTRACTS.md](../docs/API_CONTRACTS.md) · [docs/DATA_MODEL.md](../docs/DATA_MODEL.md)
- [docs/guides/TESTING.md](../docs/guides/TESTING.md) — Jest patterns & coverage · [docs/platform/CI_CD.md](../docs/platform/CI_CD.md) · [docs/platform/BRANCH_PROTECTION.md](../docs/platform/BRANCH_PROTECTION.md)
- Guides: [ADD_FEATURE](../docs/guides/ADD_FEATURE.md) · [ADD_ENDPOINT](../docs/guides/ADD_ENDPOINT.md) · [ADD_ENTITY](../docs/guides/ADD_ENTITY.md)
