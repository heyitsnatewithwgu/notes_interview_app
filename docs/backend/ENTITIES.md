# Entities (TypeORM)

How to define and register database tables. The live schema this describes is in [DATA_MODEL.md](../DATA_MODEL.md); this doc is about the **patterns**. Reference: [backend/src/notes/entities/note.entity.ts](../../backend/src/notes/entities/note.entity.ts).

## The pattern

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, VersionColumn,
} from 'typeorm';

export type NoteColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

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

## Rules for every entity

1. **`@Entity('table_name')`** with an explicit snake/lower table name.
2. **UUID primary key:** `@PrimaryGeneratedColumn('uuid')`.
3. **Timestamps:** always include `@CreateDateColumn() createdAt` and `@UpdateDateColumn() updatedAt`. `updatedAt` also powers optimistic locking ([SERVICES.md](SERVICES.md)).
4. **Explicit `type` + `default`** for non-trivial columns (`text`, `varchar`, `int`, …). Don't rely on inferred types for anything but plain required strings.
5. **Union types for enumerated columns** (like `NoteColor`) are stored as `varchar`; the allowed set is enforced in the DTO with `@IsIn([...])`, **not** as a DB enum. Keep the union type, the `@IsIn` list, and the frontend type in sync.

## Registering an entity (required, two places)

Because `synchronize: true` reads an **explicit array** (not a glob), a new entity is invisible until registered:

1. **Connection array** — add it to `entities: [...]` in [app.module.ts](../../backend/src/app.module.ts):
   ```typescript
   entities: [Note, Tag],
   ```
2. **Feature module** — expose its repository where it's used:
   ```typescript
   @Module({ imports: [TypeOrmModule.forFeature([Tag])], … })
   ```

Forget step 1 and TypeORM won't create the table; forget step 2 and `@InjectRepository(Tag)` fails at boot.

## Relations

There are no relations in the current schema (single table). When you add one, use the standard decorators and remember both sides plus the FK column:

```typescript
// On the "many" side
@ManyToOne(() => Note, (note) => note.tags)
note: Note;

// On the "one" side
@OneToMany(() => Tag, (tag) => tag.note)
tags: Tag[];
```

Load relations explicitly (`repo.find({ relations: { tags: true } })`) — they are not eager by default.

## Schema application

`synchronize: true` auto-applies entity changes to the database on boot — no migrations exist. This is convenient but **destructive-capable** (it will alter/drop columns to match). Details and the production caveat: [DATA_MODEL.md](../DATA_MODEL.md#schema-management).

## Checklist for a schema change

- [ ] Entity edited / created in a module's `entities/` folder
- [ ] New entity added to `entities: [...]` in `app.module.ts`
- [ ] Repository registered via `TypeOrmModule.forFeature([...])` in the module
- [ ] Frontend mirror type updated in `frontend/src/types/`
- [ ] [DATA_MODEL.md](../DATA_MODEL.md) and (if the wire shape changed) [API_CONTRACTS.md](../API_CONTRACTS.md) updated
