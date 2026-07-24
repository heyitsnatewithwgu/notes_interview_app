# Modules & Controllers

The NestJS wiring patterns: how a feature module is assembled and how controllers expose HTTP routes. Reference implementation: the `notes` module.

## Feature module

A feature module registers its controller, service, and the TypeORM repositories it needs.

```typescript
// notes.module.ts
@Module({
  imports: [TypeOrmModule.forFeature([Note])],
  controllers: [NotesController],
  providers: [NotesService],
})
export class NotesModule {}
```

- **`TypeOrmModule.forFeature([Note])`** — makes `Repository<Note>` injectable inside this module (via `@InjectRepository(Note)` in the service). Add every entity the module's services touch.
- **`controllers`** — the HTTP layer.
- **`providers`** — injectable services. If another module needs this service, add it to an `exports: [...]` array too (not needed today — nothing is shared).

The module must then be imported by the root `AppModule` ([STRUCTURE.md](STRUCTURE.md#root-module--appmodulets)).

## Controller

Controllers declare routes and delegate immediately to the service. Keep them logic-free.

```typescript
// notes.controller.ts
@Controller('notes')
export class NotesController {
  constructor(private readonly notesService: NotesService) {}

  @Get()
  findAll() {
    return this.notesService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.notesService.findOne(id);
  }

  @Post()
  create(@Body() createNoteDto: CreateNoteDto) {
    return this.notesService.create(createNoteDto);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateNoteDto: UpdateNoteDto) {
    return this.notesService.update(id, updateNoteDto);
  }

  @Patch('reorder')
  reorder(@Body() reorderDto: ReorderNotesDto) {
    return this.notesService.reorder(reorderDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  async delete(@Param('id') id: string): Promise<void> {
    await this.notesService.delete(id);
  }
}
```

### Conventions shown here

- **Constructor injection** with `private readonly` — the standard Nest DI pattern.
- **`@Controller('notes')`** sets the base path; method decorators (`@Get`, `@Post`, `@Put`, `@Patch`, `@Delete`) add the sub-path.
- **`@Param('id')`** binds a route param; **`@Body()`** binds and validates the request body against the DTO type (thanks to the global `ValidationPipe`).
- **Return the service result directly** — Nest serializes it to JSON and applies the default status code.
- **Status codes** are method defaults (`POST` → 201, others → 200) unless overridden. `DELETE` overrides to `204` with `@HttpCode(HttpStatus.NO_CONTENT)`.

### Route ordering gotcha

`@Patch('reorder')` is a **static** path that could collide with a `:id` param route. It works here because there is no `PATCH /:id` route — but if you add param routes for the same method, **declare the static path before the param path** so `reorder` isn't parsed as an id.

### Async handlers `return`/`await` the service

Handlers are `async` and `return`/`await` the service call (see `delete` above) so exceptions become proper HTTP responses — e.g. `DELETE` of a missing id returns `404`, not a silent `204`. Always `await` a service call whose rejection should reach the client. See [ERROR_HANDLING.md](ERROR_HANDLING.md).

## Adding a route

1. Add the method to the controller with the right decorator and DTO-typed `@Body()`.
2. Add the corresponding method to the service ([SERVICES.md](SERVICES.md)).
3. If it takes a body, add/extend a DTO ([DTOS_VALIDATION.md](DTOS_VALIDATION.md)).
4. Document it in [API_CONTRACTS.md](../API_CONTRACTS.md).

Step-by-step: [guides/ADD_ENDPOINT.md](../guides/ADD_ENDPOINT.md).
