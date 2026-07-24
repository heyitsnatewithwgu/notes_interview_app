# Guide: Add an API Endpoint

Add a route to an **existing** module (for a whole new resource, use [ADD_FEATURE.md](ADD_FEATURE.md)). Background: [MODULES.md](../backend/MODULES.md), [SERVICES.md](../backend/SERVICES.md).

Worked example: add `GET /notes/search?q=...` (server-side search).

## 1. Service method first

Add the logic to the service ([notes.service.ts](../../backend/src/notes/notes.service.ts)):

```typescript
async search(query: string): Promise<Note[]> {
  return this.notesRepository
    .createQueryBuilder('note')
    .where('note.title ILIKE :q OR note.body ILIKE :q', { q: `%${query}%` })
    .orderBy('note.position', 'ASC')
    .getMany();
}
```

Throw `NotFoundException`/`ConflictException` for error cases as needed ([ERROR_HANDLING.md](../backend/ERROR_HANDLING.md)). Always use **parameterized** query-builder values (`:q`) — never string-concatenate input.

## 2. Controller route

Add the handler ([notes.controller.ts](../../backend/src/notes/notes.controller.ts)). Use `@Query()` for query params, `@Param()` for path params, `@Body()` (DTO-typed) for bodies.

```typescript
@Get('search')
search(@Query('q') q: string) {
  return this.notesService.search(q ?? '');
}
```

**Route ordering:** a static path like `search` must be declared **before** `@Get(':id')`, or `search` will be captured as an `:id`. See [MODULES.md](../backend/MODULES.md#route-ordering-gotcha).

## 3. DTO (only if there's a request body)

For `POST`/`PUT`/`PATCH` with a body, add or extend a DTO in `dto/` and type the `@Body()` with it — see [DTOS_VALIDATION.md](../backend/DTOS_VALIDATION.md). Query/param-only endpoints don't need a DTO.

## 4. Pick the right method & status

| Intent | Method | Default status |
|--------|--------|----------------|
| Read | `GET` | 200 |
| Create | `POST` | 201 |
| Full update | `PUT` | 200 |
| Partial update / action | `PATCH` | 200 |
| Delete | `DELETE` | 204 (add `@HttpCode(HttpStatus.NO_CONTENT)`) |

## 5. Frontend client function

Add a function to the matching `api/*.ts` ([API_CLIENT.md](../frontend/API_CLIENT.md)):

```typescript
export async function searchNotes(q: string): Promise<Note[]> {
  const response = await fetch(`${API_BASE}/notes/search?q=${encodeURIComponent(q)}`);
  return handleResponse<Note[]>(response);
}
```

Always go through `handleResponse<T>()`; `encodeURIComponent` query values.

## 6. Test it

```bash
curl "http://localhost:3000/notes/search?q=hello"
```

## 7. Document

Update [API_CONTRACTS.md](../API_CONTRACTS.md) with the method, path, params/body, responses, and error codes.

## Checklist

- [ ] Service method added (parameterized queries)
- [ ] Controller route added; static paths before `:id`
- [ ] DTO added/typed if there's a body
- [ ] Correct method + status code
- [ ] Frontend client function via `handleResponse`
- [ ] `curl`-tested
- [ ] [API_CONTRACTS.md](../API_CONTRACTS.md) updated
