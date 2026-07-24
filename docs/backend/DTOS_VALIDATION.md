# DTOs & Validation

Every request body is a DTO class decorated with `class-validator`. The global `ValidationPipe` validates and sanitizes incoming payloads before they reach a controller. Reference: [backend/src/notes/dto/](../../backend/src/notes/dto/).

## How validation is wired

Set once in [main.ts](../../backend/src/main.ts):

```typescript
app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
```

- **`whitelist: true`** — strips any property that has no validation decorator on the DTO. Clients can't inject unexpected fields (e.g. a client-set `id` or `version` is dropped).
- **`transform: true`** — turns the plain JSON body into an instance of the DTO class and coerces primitive types.

A controller opts a body into validation simply by typing the `@Body()` param with a DTO class:

```typescript
@Post()
create(@Body() createNoteDto: CreateNoteDto) { … }
```

On failure the pipe throws `400 Bad Request` automatically (shape in [ERROR_HANDLING.md](ERROR_HANDLING.md) / [API_CONTRACTS.md](../API_CONTRACTS.md)).

## The three DTOs

### Create

```typescript
export class CreateNoteDto {
  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsOptional()
  body?: string;

  @IsString()
  @IsOptional()
  @IsIn(['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'])
  color?: string;

  @IsInt()
  @IsOptional()
  position?: number;
}
```

### Update — adds optimistic-lock field

```typescript
export class UpdateNoteDto {
  @IsString() @IsOptional() title?: string;
  @IsString() @IsOptional() body?: string;

  @IsString() @IsOptional()
  @IsIn(['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'])
  color?: string;

  @IsInt() @IsOptional() position?: number;

  // Optimistic locking — client must send the updatedAt it last saw
  @IsDateString()
  expectedUpdatedAt: string;
}
```

`expectedUpdatedAt` is the **only required field** on update; everything editable is optional so the client can send a partial change. The service uses it to detect conflicts ([SERVICES.md](SERVICES.md)).

### Reorder — array validation

```typescript
export class ReorderNotesDto {
  @IsArray()
  @IsString({ each: true })
  noteIds: string[];
}
```

`{ each: true }` applies the validator to every array element.

## Decorator cheat-sheet (used in this repo)

| Decorator | Meaning |
|-----------|---------|
| `@IsString()` | value is a string |
| `@IsInt()` | value is an integer |
| `@IsArray()` | value is an array (pair with `@IsString({ each: true })` etc.) |
| `@IsNotEmpty()` | non-empty (string/array) |
| `@IsOptional()` | skip all other validators when the value is absent |
| `@IsIn([...])` | value is one of a fixed set (our color enum) |
| `@IsDateString()` | ISO-8601 date string |

## Conventions

1. **One DTO per operation** — `Create*`, `Update*`, and action DTOs (`Reorder*`). Don't reuse the create DTO for updates.
2. **Update DTOs** make all editable fields `@IsOptional()`; keep any control field (like `expectedUpdatedAt`) required.
3. **Keep the color `@IsIn` list, the `NoteColor` union in the entity, and the frontend `NoteColor` type identical.** All three must change together.
4. DTOs describe the **wire contract**, not the DB row. They don't include server-managed fields (`id`, `createdAt`, `updatedAt`, `version`) — `whitelist` would strip them anyway.
5. Prefer the DTO to carry validation; don't re-validate in the service.

## Adding / changing a DTO

1. Edit or add the class in the module's `dto/` folder.
2. Type the controller `@Body()` with it.
3. If it changes the request contract, update [API_CONTRACTS.md](../API_CONTRACTS.md).
