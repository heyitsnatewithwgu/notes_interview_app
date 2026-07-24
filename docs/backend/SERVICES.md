# Services

Services hold **all business logic and data access**. Controllers stay thin; services do the work through an injected TypeORM `Repository`. Reference: [backend/src/notes/notes.service.ts](../../backend/src/notes/notes.service.ts).

## Shape

```typescript
@Injectable()
export class NotesService {
  constructor(
    @InjectRepository(Note)
    private notesRepository: Repository<Note>,
  ) {}

  async findAll(): Promise<Note[]> { … }
  async findOne(id: string): Promise<Note> { … }
  async create(dto: CreateNoteDto): Promise<Note> { … }
  async update(id: string, dto: UpdateNoteDto): Promise<Note> { … }
  async reorder(dto: ReorderNotesDto): Promise<Note[]> { … }
  async delete(id: string): Promise<void> { … }
}
```

Conventions:

- `@Injectable()` + constructor-injected `@InjectRepository(Note)`.
- Every method is `async` and returns a typed `Promise`.
- Return entities directly — the controller passes them straight to the client.
- Throw NestJS exceptions for error cases (never return `null`/error objects to the controller). See [ERROR_HANDLING.md](ERROR_HANDLING.md).

## Patterns worth copying

### Fetch-or-404

```typescript
async findOne(id: string): Promise<Note> {
  const note = await this.notesRepository.findOne({ where: { id } });
  if (!note) {
    throw new NotFoundException(`Note with id ${id} not found`);
  }
  return note;
}
```

Reuse `findOne` inside other methods (e.g. `update` calls it) so the 404 path is defined in one place.

### Ordered list

```typescript
async findAll(): Promise<Note[]> {
  return this.notesRepository.find({
    order: { position: 'ASC', updatedAt: 'DESC' },
  });
}
```

### Create at end of list (compute next position)

```typescript
async create(createNoteDto: CreateNoteDto): Promise<Note> {
  const maxPosition = await this.notesRepository
    .createQueryBuilder('note')
    .select('MAX(note.position)', 'max')
    .getRawOne();

  const note = this.notesRepository.create({
    title: createNoteDto.title,
    body: createNoteDto.body ?? '',
    color: (createNoteDto.color as NoteColor) ?? 'default',
    position: (maxPosition?.max ?? -1) + 1,
  });
  return this.notesRepository.save(note);
}
```

Notes: `create()` builds an entity instance (no DB write), `save()` persists. Defaults are applied here with `??` in addition to the entity/DTO defaults. `(maxPosition?.max ?? -1) + 1` yields `0` for the first note.

### Optimistic-locking update

This is the core of the app's concurrency story (full flow in [ARCHITECTURE.md](../ARCHITECTURE.md#the-signature-flow-optimistic-locking-conflict-resolution)):

```typescript
async update(id: string, updateNoteDto: UpdateNoteDto): Promise<Note> {
  const existingNote = await this.findOne(id);

  // Optimistic locking: reject if the note changed since the client last saw it
  const expectedUpdatedAt = new Date(updateNoteDto.expectedUpdatedAt);
  if (existingNote.updatedAt.getTime() !== expectedUpdatedAt.getTime()) {
    throw new ConflictException({
      message: 'Note has been modified by another user',
      currentNote: existingNote,
    });
  }

  if (updateNoteDto.title !== undefined) existingNote.title = updateNoteDto.title;
  if (updateNoteDto.body !== undefined) existingNote.body = updateNoteDto.body;
  if (updateNoteDto.color !== undefined) existingNote.color = updateNoteDto.color as NoteColor;
  if (updateNoteDto.position !== undefined) existingNote.position = updateNoteDto.position;

  return this.notesRepository.save(existingNote);
}
```

Key points:
- Compare `.getTime()` (millisecond equality) of the stored `updatedAt` vs. the client's `expectedUpdatedAt`.
- On mismatch, throw `ConflictException` **with an object** — that object becomes the `409` response body verbatim (`{ message, currentNote }`), which is exactly what the client reads. See [ERROR_HANDLING.md](ERROR_HANDLING.md).
- Apply only the fields that were sent (`!== undefined`), then `save()` — which bumps `updatedAt` and returns the fresh entity.
- The check uses `updatedAt`, **not** the `version` column ([DATA_MODEL.md](../DATA_MODEL.md#version-column)).

### Bulk reorder

```typescript
async reorder(reorderDto: ReorderNotesDto): Promise<Note[]> {
  const { noteIds } = reorderDto;
  await Promise.all(
    noteIds.map((id, index) => this.notesRepository.update(id, { position: index })),
  );
  return this.findAll();
}
```

Each id's `position` is set to its array index, all updates run concurrently via `Promise.all`, then the fresh ordered list is returned. (`repository.update` does a partial `UPDATE` and does **not** bump `updatedAt` the way `save()` does, nor run the optimistic-lock check — reorder is deliberately unguarded.)

### Delete-or-404

```typescript
async delete(id: string): Promise<void> {
  const result = await this.notesRepository.delete(id);
  if (result.affected === 0) {
    throw new NotFoundException(`Note with id ${id} not found`);
  }
}
```

`repository.delete` returns a `DeleteResult`; `affected === 0` means nothing matched → 404.

## Repository cheat-sheet

| Need | Call |
|------|------|
| All / filtered rows | `repo.find({ where, order })` |
| One row | `repo.findOne({ where: { id } })` |
| Build (no write) | `repo.create({ … })` |
| Insert/update entity | `repo.save(entity)` (bumps `updatedAt`, runs hooks) |
| Partial update by id | `repo.update(id, { … })` (no entity hooks) |
| Delete by id | `repo.delete(id)` → `{ affected }` |
| Aggregate / custom SQL | `repo.createQueryBuilder('alias')…getRawOne()` |
