# Guide: Add an Entity (Database Table)

Add a new TypeORM entity/table. Patterns: [ENTITIES.md](../backend/ENTITIES.md); live schema: [DATA_MODEL.md](../DATA_MODEL.md).

Worked example: a `Tag` entity.

## 1. Define the entity

`backend/src/tags/entities/tag.entity.ts`:

```typescript
import {
  Entity, PrimaryGeneratedColumn, Column,
  CreateDateColumn, UpdateDateColumn, VersionColumn,
} from 'typeorm';

@Entity('tags')
export class Tag {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  name: string;

  @Column({ type: 'varchar', default: 'default' })
  color: string;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  @VersionColumn()
  version: number;
}
```

Required for every entity: UUID PK, `createdAt`/`updatedAt`, explicit `type` + `default` on non-trivial columns. Enumerated values → a `type` union stored as `varchar`, enforced via `@IsIn` in the DTO (not a DB enum).

## 2. Register it — **two places** (both required)

`synchronize: true` reads an explicit array, so an unregistered entity is invisible.

**(a)** Add to the connection in [app.module.ts](../../backend/src/app.module.ts):

```typescript
entities: [Note, Tag],
```

**(b)** Expose its repository in the feature module:

```typescript
@Module({ imports: [TypeOrmModule.forFeature([Tag])], … })
export class TagsModule {}
```

Miss (a) → no table created. Miss (b) → `@InjectRepository(Tag)` fails at boot.

## 3. Restart — the table auto-creates

```bash
docker compose -f docker-compose.dev.yml restart backend
# verify:
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d notes -c '\dt'
```

`synchronize: true` creates/alters the table to match the entity — **no migration file** exists or is needed here. ⚠️ This is destructive-capable against real data; see the caveat in [DATA_MODEL.md](../DATA_MODEL.md#schema-management) and [SECURITY.md](SECURITY.md).

## 4. Relations (if needed)

No relations exist today. When adding one, decorate both sides and load explicitly:

```typescript
@ManyToOne(() => Note, (note) => note.tags) note: Note;
@OneToMany(() => Tag, (tag) => tag.note) tags: Tag[];
// repo.find({ relations: { tags: true } })
```

## 5. Sync the rest

- Frontend mirror type in `frontend/src/types/`.
- [DATA_MODEL.md](../DATA_MODEL.md) column table; [API_CONTRACTS.md](../API_CONTRACTS.md) if the wire shape is exposed.

## Checklist

- [ ] Entity: UUID PK, timestamps, explicit column types/defaults
- [ ] Added to `entities: [...]` in `app.module.ts`
- [ ] `TypeOrmModule.forFeature([...])` in the module
- [ ] Backend restarted; table verified in Postgres
- [ ] Frontend type + [DATA_MODEL.md](../DATA_MODEL.md) updated
