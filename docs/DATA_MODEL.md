# Data Model

The complete persistence schema. There is currently **one table**, `notes`, defined by a single TypeORM entity. Schema is applied automatically by `synchronize: true` — see [Schema management](#schema-management).

Source of truth: [backend/src/notes/entities/note.entity.ts](../backend/src/notes/entities/note.entity.ts). For the entity *patterns* (how to write one), see [backend/ENTITIES.md](backend/ENTITIES.md).

## `Note` entity

```typescript
export type NoteColor =
  | 'default' | 'red' | 'orange' | 'yellow'
  | 'green' | 'blue' | 'purple' | 'pink';

@Entity('notes')
export class Note {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column({ type: 'text', default: '' })
  body: string;

  @Column({ type: 'varchar', default: 'default' })
  color: NoteColor;

  @Column({ type: 'int', default: 0 })
  position: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
```

## Column reference

| Column | Type (Postgres) | Default | Notes |
|--------|-----------------|---------|-------|
| `id` | `uuid` | generated | Primary key, server-generated UUID. |
| `title` | `varchar` | — | Required. Not empty-checked at the DB level (enforced in the DTO via `@IsNotEmpty`). |
| `body` | `text` | `''` | Markdown source. Rendered on the client with `react-markdown`. |
| `color` | `varchar` | `'default'` | One of the 8 `NoteColor` values. **Constraint lives in the app** (`@IsIn(...)` on the DTO), not as a DB enum/check. |
| `position` | `int` | `0` | Sort order. Lower = earlier. Assigned on create and rewritten by reorder. |
| `createdAt` | `timestamp` | now | Set once by `@CreateDateColumn`. |
| `updatedAt` | `timestamp` | now, auto | Bumped by `@UpdateDateColumn` on every save. **Drives optimistic locking.** |
| `version` | `int` | `1`, auto | Incremented by TypeORM on every save. See below. |

## Ordering

`GET /notes` returns notes ordered by:

```typescript
this.notesRepository.find({ order: { position: 'ASC', updatedAt: 'DESC' } });
```

`position ASC` first (the user's manual drag order), then `updatedAt DESC` as a tiebreaker. New notes get `position = MAX(position) + 1` so they land at the end. Reordering rewrites `position` to the array index of each id (see [backend/SERVICES.md](backend/SERVICES.md)).

## Optimistic locking (`updatedAt`) {#version-column}

Concurrent-edit detection compares the client's last-seen `updatedAt` against the row's current `updatedAt`:

```typescript
const expectedUpdatedAt = new Date(updateNoteDto.expectedUpdatedAt);
if (existingNote.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
  throw new ConflictException({ message: '...', currentNote: existingNote });
}
```

The end-to-end flow is described in [ARCHITECTURE.md](ARCHITECTURE.md#the-signature-flow-optimistic-locking-conflict-resolution).

> **The `version` column is not used for locking.** `@VersionColumn()` is present and TypeORM increments it on each `save()`, but the conflict check reads `updatedAt`, not `version`. If you ever switch to TypeORM's native version-based locking (`repository.save(entity, { /* version check */ })` or the `version` option on `findOne`), update this doc and [backend/SERVICES.md](backend/SERVICES.md). For now, treat `version` as an unused-but-persisted column and keep the `updatedAt` mechanism.

## Frontend mirror type

The client redeclares the shape in [frontend/src/types/note.ts](../frontend/src/types/note.ts). It is intentionally **not** auto-generated, so it must be kept in sync by hand when the entity changes:

```typescript
export interface Note {
  id: string;
  title: string;
  body: string;
  color: NoteColor;
  position: number;
  updatedAt: string;   // string over the wire (JSON), Date in the entity
  createdAt: string;
}
```

Note the type drift on the date fields: they are `Date` on the entity and `string` in transit/on the client. The client wraps them in `new Date(...)` where needed (e.g. `formatDistanceToNow`).

## Schema management

- Configured in [backend/src/app.module.ts](../backend/src/app.module.ts): `synchronize: configService.get('DB_SYNCHRONIZE', 'true') === 'true'`.
- With `synchronize: true`, TypeORM inspects the `entities: [Note]` array on boot and creates/alters tables to match. **No migration files exist and none are needed for local/dev use.**
- Entities are registered as an **explicit array** (`entities: [Note]`), not a glob. When you add an entity you must add it to that array — see [backend/ENTITIES.md](backend/ENTITIES.md).
- ⚠️ `synchronize: true` can drop/alter columns to match entities and is **not safe against a production database with real data**. Migrations are the documented next step — see [guides/SECURITY.md](guides/SECURITY.md) and [platform/DEPLOYMENT.md](platform/DEPLOYMENT.md).

## Changing the model

When you add/rename/remove a column or entity:

1. Edit the entity in `backend/src/notes/entities/` (or a new module's `entities/`).
2. If it's a new entity, add it to `entities: [...]` in `app.module.ts` and register the repository in the feature module (`TypeOrmModule.forFeature([...])`).
3. Update the frontend mirror type in `frontend/src/types/`.
4. **Update this file** (column table above) and [API_CONTRACTS.md](API_CONTRACTS.md) if the wire shape changed.
