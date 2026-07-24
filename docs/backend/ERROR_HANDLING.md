# Error Handling

The backend uses NestJS's built-in HTTP exceptions. There is **no custom exception filter** — Nest's default filter serializes thrown `HttpException`s to JSON with the right status code.

## Rules

1. **Throw, don't return errors.** Services throw `HttpException` subclasses; controllers let them propagate.
2. **Use the semantic exception** for the situation (`NotFoundException` → 404, `ConflictException` → 409, `BadRequestException` → 400, …).
3. **Let `ValidationPipe` own 400s** for body validation — don't hand-roll them.
4. **`await` promises that can reject** so rejections become clean error responses (see the caveat below).

## The exceptions in use

### `NotFoundException` → 404

Thrown by `findOne` and `delete` when an id doesn't exist:

```typescript
throw new NotFoundException(`Note with id ${id} not found`);
```

Default body (string argument):

```json
{ "statusCode": 404, "message": "Note with id … not found", "error": "Not Found" }
```

### `ConflictException` → 409 (custom body)

The optimistic-lock failure. This one is special: it's constructed with an **object**, so that object becomes the response body **as-is** — Nest does not add `statusCode`/`error` keys when you pass an object:

```typescript
throw new ConflictException({
  message: 'Note has been modified by another user',
  currentNote: existingNote,
});
```

Response body (HTTP status is still `409`):

```json
{ "message": "Note has been modified by another user", "currentNote": { … } }
```

This exact shape is the contract the frontend depends on — its API client reads `data.message` and `data.currentNote` to build a client-side `ConflictException` and open the resolution dialog. See [frontend/API_CLIENT.md](../frontend/API_CLIENT.md) and [API_CONTRACTS.md](../API_CONTRACTS.md). **If you change this object's keys, you must update the frontend.**

### `400 Bad Request` — from `ValidationPipe`

Thrown automatically when a DTO fails validation. `message` is an **array** of human-readable failures:

```json
{ "statusCode": 400, "message": ["title should not be empty"], "error": "Bad Request" }
```

See [DTOS_VALIDATION.md](DTOS_VALIDATION.md).

## Choosing an exception

| Situation | Throw | Status |
|-----------|-------|--------|
| Resource id not found | `NotFoundException` | 404 |
| Concurrent-edit conflict | `ConflictException` (object body) | 409 |
| Invalid/malformed body | *(automatic via `ValidationPipe`)* | 400 |
| Caller not allowed | `ForbiddenException` | 403 |
| Unauthenticated | `UnauthorizedException` | 401 |
| Bad but valid-shaped input | `BadRequestException` | 400 |

(The last three aren't used yet — there's no auth — but follow these when adding them. See [guides/SECURITY.md](../guides/SECURITY.md).)

## Async handlers: always `await` the service

The `delete` handler is `async` and **awaits** the service, so a missing id returns a clean `404` and a DB error becomes a proper error response:

```typescript
@Delete(':id')
@HttpCode(HttpStatus.NO_CONTENT)
async delete(@Param('id') id: string): Promise<void> {
  await this.notesService.delete(id);
}
```

> Historical note: this handler once called `this.notesService.delete(id)` **without** `await`/`return`, so `DELETE` of a missing id silently returned `204` instead of `404`. Adding the test suite surfaced it and the one-line fix was applied. `test/regression.e2e-spec.ts` and `test/notes.e2e-spec.ts` now pin the `404`/`204` behavior — keep handlers `async` + `await`ed so they stay green.

## No global filter (yet)

If the app later needs a uniform error envelope across every endpoint, add an `ExceptionFilter` and register it in `main.ts` with `app.useGlobalFilters(...)`. Document the envelope here and in [API_CONTRACTS.md](../API_CONTRACTS.md) when you do.
