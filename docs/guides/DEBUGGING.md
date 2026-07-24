# Guide: Debugging

Common issues and how to diagnose them. Runtime topology: [ARCHITECTURE.md](../ARCHITECTURE.md); Docker details: [platform/DOCKER.md](../platform/DOCKER.md).

## Logs & shells

```bash
# Dev stack logs
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml logs -f frontend

# Shell into a running container
docker compose -f docker-compose.dev.yml exec backend sh

# psql into the database (dev exposes 5432)
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d notes
# \dt list tables · \d notes describe · SELECT * FROM notes;
```

## CORS errors ("blocked by CORS policy")

The browser origin isn't in the allow-list. Add it to `app.enableCors({ origin: [...] })` in [backend/src/main.ts](../../backend/src/main.ts) (current: `http://localhost:5173`, `:80`, `localhost`). Restart the backend. Note credentials are **not** enabled — don't send cookies.

## Backend won't start / DB connection refused

- **`ECONNREFUSED` to Postgres:** in Docker, `DB_HOST` must be `postgres` (the service name), not `localhost`. Compose sets this; a stray local `.env` can override it. See [ENV_VARS.md](../ENV_VARS.md).
- **Postgres not ready:** the backend `depends_on` the postgres healthcheck; on a cold start give it a few seconds. Check `docker compose ... logs postgres`.
- **Port 3000 in use:** something else owns `3000`. Stop it, or change the host mapping in `docker-compose.dev.yml` (the in-container port is hardcoded to `3000` in `main.ts`).

## Schema looks wrong / column missing

`synchronize: true` rebuilds schema from the entity **on boot** — so a change needs a **backend restart**, and the entity must be registered in `entities: [...]` in `app.module.ts`. If a new table/column didn't appear:
1. Is the entity in the `entities` array? ([ENTITIES.md](../backend/ENTITIES.md))
2. Did you restart the backend?
3. Inspect with `\d <table>` in psql.

There are no migrations to run — see [DATA_MODEL.md](../DATA_MODEL.md#schema-management).

## `400 Bad Request` on a valid-looking request

The `ValidationPipe` rejected the body. The response `message` is an **array** of specific failures — read it. Common causes: missing required field (`title`, or `expectedUpdatedAt` on update), wrong type, or a `color` outside the `@IsIn` set. See [backend/DTOS_VALIDATION.md](../backend/DTOS_VALIDATION.md). Also: `whitelist: true` silently **strips** unknown fields, so a typo'd field name is dropped rather than erroring.

## `409 Conflict` unexpectedly

Optimistic-lock mismatch: the `expectedUpdatedAt` sent didn't equal the note's current `updatedAt`. Expected if the note changed since load. If it happens on **every** save, the client isn't updating its stored `updatedAt` from the previous response — verify `setNote(updatedNote)` runs after a successful save ([frontend/STATE_MANAGEMENT.md](../frontend/STATE_MANAGEMENT.md)). Flow: [ARCHITECTURE.md](../ARCHITECTURE.md#the-signature-flow-optimistic-locking-conflict-resolution).

## Frontend calls the wrong API URL

`VITE_API_URL` is inlined at **build time**. Changing it requires a rebuild (`vite build` / rebuild the frontend image), not just a restart. Default is `http://localhost:3000`. See [ENV_VARS.md](../ENV_VARS.md).

## Dark mode / theme oddities

Theming is the `.dark` class on `<html>` via `useDarkMode` ([frontend/HOOKS.md](../frontend/HOOKS.md)) — **not** `next-themes`. If a component isn't themed, it's likely using raw palette colors instead of semantic tokens ([frontend/STYLING.md](../frontend/STYLING.md)). Inspect `<html class="dark">` in devtools.

## Drag-to-reorder snaps back

The optimistic reorder reverts on a failed `PATCH /notes/reorder`. Check the network tab / backend logs for the failure ([frontend/STATE_MANAGEMENT.md](../frontend/STATE_MANAGEMENT.md#optimistic-ui)).

## Tests failing

- **Backend Jest DB error / "no such table":** the E2E layer uses **in-memory SQLite** via `test/utils/create-test-app.ts` — you don't need Postgres running. If a spec hangs, ensure `afterAll(() => app.close())` runs.
- **Frontend Radix test throws on pointer/scroll APIs:** jsdom lacks them; the polyfills live in `src/test/setup.ts`. New overlays (Dialog/Popover) work through it.
- **`err instanceof ConflictException` is false in a `NoteEdit` test:** use a **partial** mock that keeps the real class — `vi.mock('@/api/notes', async (o) => ({ ...(await o()), updateNote: vi.fn() }))` — then throw `new api.ConflictException(...)`.
- **Coverage gate fails locally:** `npm run test:cov` prints uncovered lines — add tests, never lower the threshold. See [TESTING.md](TESTING.md).
- **Playwright can't reach the app:** the stack must be up (`docker compose -f docker-compose.dev.yml up`) and `E2E_BASE_URL` set (defaults to `http://localhost:5173`).

## Type checks / lint

```bash
cd frontend && npm run lint          # ESLint
cd frontend && npx tsc -b            # type-check without emitting
cd backend  && npx tsc --noEmit      # type-check the backend
```

## Clean rebuild (last resort)

```bash
docker compose -f docker-compose.dev.yml down -v   # -v also drops the DB volume
docker compose -f docker-compose.dev.yml up --build
```

`-v` deletes `postgres_data_dev` — you lose local notes. Omit it to keep data.
