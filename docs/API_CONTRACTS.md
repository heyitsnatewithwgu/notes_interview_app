# API Contracts

The complete HTTP surface. There is one resource, `notes`, served by [NotesController](../backend/src/notes/notes.controller.ts). Base URL is `http://localhost:3000` in both dev and (via the reverse proxy) prod — see [ENV_VARS.md](ENV_VARS.md) and [platform/NGINX.md](platform/NGINX.md).

All request bodies are validated by DTOs ([backend/DTOS_VALIDATION.md](backend/DTOS_VALIDATION.md)); unknown fields are stripped by the global `ValidationPipe({ whitelist: true })`.

## Endpoint summary

| Method | Path | Body | Success | Errors |
|--------|------|------|---------|--------|
| `GET` | `/notes` | — | `200` `Note[]` | — |
| `GET` | `/notes/:id` | — | `200` `Note` | `404` |
| `POST` | `/notes` | `CreateNoteDto` | `201` `Note` | `400` |
| `PUT` | `/notes/:id` | `UpdateNoteDto` | `200` `Note` | `400`, `404`, **`409`** |
| `PATCH` | `/notes/reorder` | `ReorderNotesDto` | `200` `Note[]` | `400` |
| `DELETE` | `/notes/:id` | — | `204` (no body) | `404` |

> Status codes are NestJS defaults per method (`POST` → 201, `DELETE` → 204 via `@HttpCode(HttpStatus.NO_CONTENT)`, everything else → 200). `PATCH /notes/reorder` is declared **before** `PUT/GET/DELETE /:id` handlers in the controller so `reorder` is not captured as an `:id`.

## Types

```typescript
// Note (response shape; dates are ISO strings over the wire)
{ id: string; title: string; body: string; color: NoteColor;
  position: number; createdAt: string; updatedAt: string }

type NoteColor = 'default'|'red'|'orange'|'yellow'|'green'|'blue'|'purple'|'pink'

// CreateNoteDto
{ title: string;            // required, non-empty
  body?: string;            // default ''
  color?: NoteColor;        // default 'default'
  position?: number }       // normally omitted; server assigns MAX+1

// UpdateNoteDto
{ title?: string; body?: string; color?: NoteColor; position?: number;
  expectedUpdatedAt: string } // REQUIRED ISO date — drives optimistic locking

// ReorderNotesDto
{ noteIds: string[] }       // full ordered list of note ids
```

## Endpoints in detail

### `GET /notes`
Returns all notes ordered by `position ASC, updatedAt DESC`. No pagination; the frontend filters/searches client-side.

```bash
curl http://localhost:3000/notes
```

### `GET /notes/:id`
```bash
curl http://localhost:3000/notes/8f3c…
```
`404` if not found: `{ "statusCode": 404, "message": "Note with id 8f3c… not found", "error": "Not Found" }`.

### `POST /notes`
Creates a note at the end of the list (`position = MAX(position)+1`). Returns `201`.

```bash
curl -X POST http://localhost:3000/notes \
  -H 'Content-Type: application/json' \
  -d '{"title":"My note","body":"Hello **world**","color":"blue"}'
```

### `PUT /notes/:id`
Full update **with optimistic locking**. `expectedUpdatedAt` must equal the note's current `updatedAt` or the request is rejected with `409`.

```bash
curl -X PUT http://localhost:3000/notes/8f3c… \
  -H 'Content-Type: application/json' \
  -d '{"title":"Edited","body":"...","color":"green","expectedUpdatedAt":"2026-07-24T10:00:00.000Z"}'
```

**`409 Conflict`** body — note the custom shape (no `statusCode`/`error` keys, because the service passes an object to `ConflictException`):

```json
{
  "message": "Note has been modified by another user",
  "currentNote": { "id": "8f3c…", "title": "...", "updatedAt": "2026-07-24T10:05:00.000Z", "...": "..." }
}
```

The client's `ConflictException` reads `message` and `currentNote` from this body and opens the resolution dialog. See [frontend/API_CLIENT.md](frontend/API_CLIENT.md) and [ARCHITECTURE.md](ARCHITECTURE.md#the-signature-flow-optimistic-locking-conflict-resolution).

### `PATCH /notes/reorder`
Rewrites every note's `position` to its index in `noteIds`, then returns the full reordered list.

```bash
curl -X PATCH http://localhost:3000/notes/reorder \
  -H 'Content-Type: application/json' \
  -d '{"noteIds":["id-a","id-b","id-c"]}'
```

### `DELETE /notes/:id`
Returns `204` with no body on success; `404` if the id doesn't exist.

```bash
curl -i -X DELETE http://localhost:3000/notes/8f3c…
```

## Error response shapes

| Status | When | Shape |
|--------|------|-------|
| `400` | DTO validation fails (`ValidationPipe`) | `{ "statusCode": 400, "message": ["title should not be empty", …], "error": "Bad Request" }` |
| `404` | `findOne`/`delete` can't find the id | `{ "statusCode": 404, "message": "Note with id … not found", "error": "Not Found" }` |
| `409` | Optimistic-lock mismatch on `PUT` | `{ "message": "…", "currentNote": { … } }` (custom) |

See [backend/ERROR_HANDLING.md](backend/ERROR_HANDLING.md) for how these are produced.

## CORS

The API allows the frontend origins only, configured in [backend/src/main.ts](../backend/src/main.ts):

```typescript
app.enableCors({
  origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost'],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
  allowedHeaders: ['Content-Type'],
});
```

Add new browser origins here. Credentials are **not** enabled (no cookies/auth).

## When you change the API

Update this file whenever you add/change/remove an endpoint or alter a request/response shape, and keep [DATA_MODEL.md](DATA_MODEL.md) and the frontend types/api client in step. This is listed in the root [CLAUDE.md](../CLAUDE.md) doc-sync table.
