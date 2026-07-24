# Guide: Add a Feature (End-to-End)

Build a complete feature from database to UI. This is the flagship guide; the focused guides ([ADD_ENTITY](ADD_ENTITY.md), [ADD_ENDPOINT](ADD_ENDPOINT.md), [ADD_PAGE](ADD_PAGE.md), [ADD_COMPONENT](ADD_COMPONENT.md)) drill into each step.

Worked example below: adding a **Tags** feature (a second resource alongside notes). Follow the same shape for any feature.

## Before you start

1. Read [ARCHITECTURE.md](../ARCHITECTURE.md) and [CONVENTIONS.md](../CONVENTIONS.md).
2. Confirm the requirements with the user before writing code.
3. Do **not** add npm dependencies without asking (see root [CLAUDE.md](../../CLAUDE.md)).

## Step 1 — Backend module scaffold

Create `backend/src/tags/` mirroring `notes/`:

```
tags/
├── tags.module.ts
├── tags.controller.ts
├── tags.service.ts
├── dto/
│   ├── create-tag.dto.ts
│   └── update-tag.dto.ts
└── entities/
    └── tag.entity.ts
```

## Step 2 — Entity → [ADD_ENTITY.md](ADD_ENTITY.md)

Define `Tag` (UUID PK, timestamps, explicit column types), then **register it in two places**: `entities: [Note, Tag]` in `app.module.ts` and `TypeOrmModule.forFeature([Tag])` in `tags.module.ts`. With `synchronize: true`, the table is created on boot — no migration.

## Step 3 — DTOs → [DTOS_VALIDATION.md](../backend/DTOS_VALIDATION.md)

`CreateTagDto` / `UpdateTagDto` with `class-validator` decorators. If the resource supports optimistic-locked updates, include `@IsDateString() expectedUpdatedAt`.

## Step 4 — Service → [SERVICES.md](../backend/SERVICES.md)

`@Injectable()` with `@InjectRepository(Tag)`. Implement `findAll/findOne/create/update/delete`. Reuse the patterns: fetch-or-404, `save()` for writes, throw `NotFoundException`/`ConflictException`.

## Step 5 — Controller → [MODULES.md](../backend/MODULES.md)

`@Controller('tags')`, constructor-inject the service, one handler per route, DTO-typed `@Body()`. `@HttpCode(HttpStatus.NO_CONTENT)` on delete.

## Step 6 — Wire the module in

Add `TagsModule` to `imports` in `app.module.ts`. Restart the backend and smoke-test with `curl` (see [DEBUGGING.md](DEBUGGING.md)).

## Step 7 — Document the backend

Update [API_CONTRACTS.md](../API_CONTRACTS.md) (new endpoints) and [DATA_MODEL.md](../DATA_MODEL.md) (new table). This is required, not optional.

## Step 8 — Frontend types

Add the mirror types in `frontend/src/types/tag.ts` (`Tag`, `CreateTagDto`, `UpdateTagDto`) matching the wire shape. Dates are `string` on the client.

## Step 9 — API client → [API_CLIENT.md](../frontend/API_CLIENT.md)

Add `frontend/src/api/tags.ts` with `fetchTags`, `createTag`, … each calling `fetch` and returning `handleResponse<T>()`. Reuse the `ConflictException` handling if the resource is lock-protected.

## Step 10 — UI: page & components → [ADD_PAGE.md](ADD_PAGE.md), [ADD_COMPONENT.md](ADD_COMPONENT.md)

1. Page in `frontend/src/pages/`, fetching in `useEffect`, with loading/error/empty branches ([STATE_MANAGEMENT.md](../frontend/STATE_MANAGEMENT.md)).
2. Register the route in `App.tsx`.
3. Feature components composed from `ui/` primitives, styled with semantic tokens + `cn()`, animated with Framer Motion.

## Step 11 — Verify locally

```bash
docker compose -f docker-compose.dev.yml up --build
```

Exercise create/read/update/delete in the browser at `http://localhost:5173`; confirm error and empty states; confirm any optimistic-lock conflict path. Run `npm run lint` in `frontend/` and `npm run build` in both packages.

## Definition of done

- [ ] Entity created and registered (both places); table appears in Postgres
- [ ] DTOs validate input; unknown fields stripped by `whitelist`
- [ ] Service throws the right exceptions; controller is logic-free
- [ ] Module imported in `app.module.ts`
- [ ] Frontend types mirror the backend shape
- [ ] API calls go through `handleResponse`; errors show a toast
- [ ] Page has loading / error / empty / content states and a route
- [ ] `frontend` lint + both `build`s pass
- [ ] [API_CONTRACTS.md](../API_CONTRACTS.md) and [DATA_MODEL.md](../DATA_MODEL.md) updated
- [ ] Folder `CLAUDE.md` directory trees updated if you added files/dirs
- [ ] (If you set up tests) tests added — see [TESTING.md](TESTING.md)

Pre-PR: [SUBMITTING_PR.md](SUBMITTING_PR.md).
