# Architecture

System-level context for the Collaborative Notes App. Read this first before making cross-cutting changes. For coding standards see [CONVENTIONS.md](CONVENTIONS.md); for the data schema see [DATA_MODEL.md](DATA_MODEL.md); for the HTTP surface see [API_CONTRACTS.md](API_CONTRACTS.md).

## What this app is

A single-page notes app that lets a user create, edit, reorder, color, search, and delete notes. Its distinguishing feature is **graceful handling of concurrent edits**: if two clients edit the same note, the second save is rejected with a `409 Conflict` that carries the current server state, and the UI presents a side-by-side "your changes vs. server version" resolution dialog. This is **conflict *detection* + manual resolution**, not real-time collaborative editing (there are no WebSockets or CRDTs).

It is a monorepo with two independently-built packages plus infra:

| Package | Stack | Role |
|---------|-------|------|
| [backend/](../backend) | NestJS 11 + TypeORM + PostgreSQL 16 | REST API (`/notes`) |
| [frontend/](../frontend) | React 19 + Vite 7 + Tailwind v4 + shadcn/ui | SPA client |
| [nginx/](../nginx) | nginx:alpine | Reverse proxy (production only) |

## Component diagram

```
                         Browser (SPA)
                              │
              ┌───────────────┴────────────────┐
              │ static assets                   │ fetch() JSON
              ▼                                 ▼
   ┌─────────────────────┐          ┌──────────────────────┐
   │ frontend (nginx:80) │          │  API entrypoint :3000 │
   │  serves dist/ build  │          │  (see topology below) │
   └─────────────────────┘          └───────────┬──────────┘
                                                 ▼
                                     ┌──────────────────────┐
                                     │ backend (NestJS :3000)│
                                     │  NotesController      │
                                     │  → NotesService       │
                                     │  → TypeORM Repository │
                                     └───────────┬──────────┘
                                                 ▼
                                     ┌──────────────────────┐
                                     │ PostgreSQL 16 (notes) │
                                     └──────────────────────┘
```

The backend is a thin, conventional NestJS layering:

```
HTTP request → NotesController (routing, @Body/@Param binding, ValidationPipe)
             → NotesService   (business logic: ordering, optimistic locking)
             → Repository<Note> (TypeORM data access)
             → PostgreSQL
```

There is currently **one feature module** (`notes`) and **one entity** (`Note`). See [backend/STRUCTURE.md](backend/STRUCTURE.md).

## Runtime topology: dev vs. prod

The two Docker Compose files describe meaningfully different topologies. See [platform/DOCKER.md](platform/DOCKER.md) and [platform/NGINX.md](platform/NGINX.md) for detail.

### Development — `docker-compose.dev.yml`

The browser talks to the NestJS backend **directly**; there is no reverse proxy.

| Service | Host port | Notes |
|---------|-----------|-------|
| frontend | `5173` | Vite dev server (`npm run dev -- --host`), HMR |
| backend | `3000` | NestJS via `nodemon`/`ts-node`, hot reload |
| postgres | `5432` | exposed for local `psql` access |

`VITE_API_URL=http://localhost:3000` → browser calls `http://localhost:3000/notes`.

### Production — `docker-compose.yml`

Two nginx roles. The frontend image bakes the SPA build and serves it on `:80`. A **separate** nginx reverse proxy owns `:3000` and forwards to the backend container (which exposes **no** host port).

| Service | Host port | Notes |
|---------|-----------|-------|
| frontend | `80` | nginx serving `dist/` (see `frontend/nginx.conf`) |
| nginx | `3000` | reverse proxy → `backend:3000` (see `nginx/nginx.conf`) |
| backend | — | reachable only on the internal `app-network` |
| postgres | — | reachable only on the internal `app-network` |

The frontend build arg `VITE_API_URL` defaults to `http://localhost:3000`, so the browser still calls `:3000` — but in prod that port is the reverse proxy, not the backend directly.

## The signature flow: optimistic-locking conflict resolution

This is the most important behavior in the app. Every edit round-trips the `updatedAt` timestamp the client last saw.

```
1. Client loads a note → keeps note.updatedAt in memory (lastSavedRef / note state).
2. Client edits, autosave fires (debounced) → PUT /notes/:id
   body: { title, body, color, expectedUpdatedAt: note.updatedAt }
3. Backend (NotesService.update) compares:
       existingNote.updatedAt.getTime() === new Date(expectedUpdatedAt).getTime() ?
   ├─ match   → apply changes, save, return 200 + updated note (new updatedAt)
   └─ mismatch → throw ConflictException → 409 { message, currentNote }
4. Client:
   ├─ 200 → update local note + lastSavedRef, status "saved"
   └─ 409 → ConflictException carries currentNote → open resolution Dialog:
            • "Keep My Changes & Retry" → adopt server's updatedAt, re-save
            • "Use Server Version"      → overwrite local editor with server note
```

Backend check ([backend/src/notes/notes.service.ts](../backend/src/notes/notes.service.ts)):

```typescript
const expectedUpdatedAt = new Date(updateNoteDto.expectedUpdatedAt);
if (existingNote.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
  throw new ConflictException({
    message: 'Note has been modified by another user',
    currentNote: existingNote,
  });
}
```

Frontend handling ([frontend/src/pages/NoteEdit.tsx](../frontend/src/pages/NoteEdit.tsx) + [frontend/src/api/notes.ts](../frontend/src/api/notes.ts)): the API client maps `409` to a custom `ConflictException` carrying `currentNote`; `NoteEdit` catches it and drives the `<Dialog>`.

> **Note on the mechanism:** locking is done by **`updatedAt` timestamp comparison**, not by TypeORM's `@VersionColumn`. The `Note.version` column exists and TypeORM increments it on every save, but the app's conflict logic never reads it. See [DATA_MODEL.md](DATA_MODEL.md#version-column).

## Key design decisions (and honest caveats)

| Decision | Where | Caveat |
|----------|-------|--------|
| `synchronize: true` (TypeORM auto-creates/updates schema from entities) | `app.module.ts` | Fine for this app; **there are no migrations**. Not safe for a real production DB — see [DATA_MODEL.md](DATA_MODEL.md) and [guides/SECURITY.md](guides/SECURITY.md). |
| No authentication / authorization | everywhere | Every note is world-readable/writable. This is an interview/demo app. See [guides/SECURITY.md](guides/SECURITY.md). |
| Timestamp-based optimistic locking | `notes.service.ts` | Relies on millisecond equality of `updatedAt`; the `version` column is unused. |
| Client-side search & no pagination | `NotesList.tsx` | `GET /notes` returns all notes; search filters in the browser. Fine at small scale. |
| Local component state only (no store, no React Query) | frontend | Each page fetches in `useEffect`. See [frontend/STATE_MANAGEMENT.md](frontend/STATE_MANAGEMENT.md). |
| Port `3000` hardcoded in `main.ts` | backend | Not env-driven. See [ENV_VARS.md](ENV_VARS.md). |

## Where to go next

- Add a feature end-to-end → [guides/ADD_FEATURE.md](guides/ADD_FEATURE.md)
- Backend internals → [backend/STRUCTURE.md](backend/STRUCTURE.md)
- Frontend internals → [frontend/STRUCTURE.md](frontend/STRUCTURE.md)
- Run it locally → [platform/DOCKER.md](platform/DOCKER.md)
