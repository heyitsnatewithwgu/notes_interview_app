# API Client

All backend communication goes through one module: [frontend/src/api/notes.ts](../../frontend/src/api/notes.ts). It uses the native `fetch` API — **no axios, no react-query, no SWR**. Components never call `fetch` directly.

## Base URL

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

Build-time value from `VITE_API_URL` (see [ENV_VARS.md](../ENV_VARS.md)), falling back to `localhost:3000`.

## Response handling

A single generic helper normalizes every response — this is where status codes become typed results or thrown errors:

```typescript
async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 409) {
    const data = await response.json();
    throw new ConflictException(data);           // carries currentNote
  }
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  if (response.status === 204) {
    return undefined as T;                        // DELETE has no body
  }
  return response.json();
}
```

Precedence matters: **409 is checked first** (it's a normal, expected outcome with a meaningful body), then other non-2xx become a plain `Error`, then 204 returns `undefined`, else parse JSON.

## The conflict exception

```typescript
export class ConflictException extends Error {
  currentNote: Note;
  constructor(data: ConflictError) {
    super(data.message);
    this.name = 'ConflictException';
    this.currentNote = data.currentNote;
  }
}
```

This mirrors the backend's `409` body `{ message, currentNote }` ([API_CONTRACTS.md](../API_CONTRACTS.md)). Consumers do `catch (err) { if (err instanceof ConflictException) … }` — that's how `NoteEdit` opens the resolution dialog ([STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)).

## The functions

| Function | Method + path | Returns |
|----------|---------------|---------|
| `fetchNotes()` | `GET /notes` | `Note[]` |
| `fetchNote(id)` | `GET /notes/:id` | `Note` |
| `createNote(data)` | `POST /notes` | `Note` |
| `updateNote(id, data)` | `PUT /notes/:id` | `Note` (throws `ConflictException` on 409) |
| `reorderNotes(noteIds)` | `PATCH /notes/reorder` | `Note[]` |
| `deleteNote(id)` | `DELETE /notes/:id` | `void` |

Representative implementation (all follow this shape):

```typescript
export async function updateNote(id: string, data: UpdateNoteDto): Promise<Note> {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Note>(response);
}
```

## Conventions

1. **One function per endpoint**, camelCase verb naming (`fetchNotes`, `createNote`, …).
2. **Always route through `handleResponse<T>()`** — never inspect `response.ok`/status in a component.
3. **Types come from `@/types/note`** (`Note`, `CreateNoteDto`, `UpdateNoteDto`, `ConflictError`). Keep these in sync with the backend DTOs/entity ([DATA_MODEL.md](../DATA_MODEL.md)).
4. **Throw, don't return error flags.** Callers use `try/catch` and surface failures with `toast.error(...)`.
5. **No caching/state in this layer** — it's pure request/response. Data lives in component state ([STATE_MANAGEMENT.md](STATE_MANAGEMENT.md)).

## Adding a call

1. Add a function to `api/notes.ts` (or a new `api/<resource>.ts` for a new resource) that calls `fetch` and returns `handleResponse<T>()`.
2. Add/extend the request/response types in `types/`.
3. Call it from a page/component inside `try/catch`, with loading state and a `toast` on error.

See [guides/ADD_ENDPOINT.md](../guides/ADD_ENDPOINT.md) for the full backend-to-frontend path.
