# Backend Structure

How the NestJS backend is laid out and boots. For folder-level rules and the tech stack, see [backend/CLAUDE.md](../../backend/CLAUDE.md).

## Directory layout

```
backend/
├── src/
│   ├── main.ts              # Bootstrap: CORS, ValidationPipe, listen(3000)
│   ├── app.module.ts        # Root module: ConfigModule + TypeOrmModule + NotesModule
│   └── notes/               # The one feature module
│       ├── notes.module.ts       # Wires controller + service + Note repository
│       ├── notes.controller.ts   # @Controller('notes') — HTTP routing
│       ├── notes.service.ts       # @Injectable() — business logic + data access
│       ├── dto/
│       │   ├── create-note.dto.ts
│       │   ├── update-note.dto.ts
│       │   └── reorder-notes.dto.ts
│       └── entities/
│           └── note.entity.ts     # @Entity('notes')
├── Dockerfile               # Multi-stage: development / build / production
├── tsconfig.json            # CommonJS, ES2021, decorators on
└── package.json             # ts-node/nodemon scripts (no Nest CLI flow)
```

There is no `nest-cli.json`. The app is **not** run with `nest start` — it runs `ts-node` directly (see [package.json scripts](#scripts)).

## Layering

Each feature follows the standard NestJS three-layer split:

```
Controller  →  Service  →  Repository<Entity>  →  PostgreSQL
(routing)      (logic)     (TypeORM data access)
```

- **Controller** — declares routes, binds `@Param`/`@Body`, delegates to the service. No logic. See [MODULES.md](MODULES.md).
- **Service** — all business logic (ordering, optimistic-lock check, reorder), injected `Repository<Note>`. See [SERVICES.md](SERVICES.md).
- **Entity** — the TypeORM table definition. See [ENTITIES.md](ENTITIES.md).
- **DTOs** — validated request-body shapes. See [DTOS_VALIDATION.md](DTOS_VALIDATION.md).

## Bootstrap — `main.ts`

```typescript
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors({
    origin: ['http://localhost:5173', 'http://localhost:80', 'http://localhost'],
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type'],
  });

  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));

  await app.listen(3000);
  console.log('Backend running on http://localhost:3000');
}
bootstrap();
```

Three things are configured globally here, and only here:

1. **CORS** — the allow-list of frontend origins. Add new browser origins here.
2. **ValidationPipe** — `whitelist: true` strips properties with no DTO decorator; `transform: true` coerces payloads to DTO class instances and primitive types.
3. **Port** — hardcoded `3000` (not env-driven — see [ENV_VARS.md](../ENV_VARS.md)).

## Root module — `app.module.ts`

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME', 'postgres'),
        password: configService.get('DB_PASSWORD', 'postgres'),
        database: configService.get('DB_DATABASE', 'notes'),
        entities: [Note],
        synchronize: configService.get('DB_SYNCHRONIZE', 'true') === 'true',
      }),
      inject: [ConfigService],
    }),
    NotesModule,
  ],
})
export class AppModule {}
```

- `ConfigModule.forRoot({ isGlobal: true })` — makes `ConfigService` injectable everywhere; no need to re-import it per module.
- `TypeOrmModule.forRootAsync(...)` — the single DB connection, built from env with defaults.
- `entities: [Note]` — an **explicit array**. Every new entity must be added here (see [ENTITIES.md](ENTITIES.md)).
- Each feature module (`NotesModule`) is imported here.

## Scripts

From [backend/package.json](../../backend/package.json):

| Script | Command | Use |
|--------|---------|-----|
| `start` | `ts-node -r tsconfig-paths/register src/main.ts` | Run once (used by the prod image only after `build`). |
| `start:dev` | `nodemon --watch src --ext ts --exec 'ts-node …'` | Hot-reload dev. |
| `build` | `tsc` | Compile to `dist/` (prod image runs `node dist/main.js`). |
| `test` / `test:cov` | `jest` / `jest --coverage` | Unit + E2E; ~89% coverage (70% gate). See [guides/TESTING.md](../guides/TESTING.md). |

## Adding to the backend

- New endpoint on an existing resource → [guides/ADD_ENDPOINT.md](../guides/ADD_ENDPOINT.md)
- New entity/table → [guides/ADD_ENTITY.md](../guides/ADD_ENTITY.md)
- New feature module (controller + service + entity + DTOs) → [guides/ADD_FEATURE.md](../guides/ADD_FEATURE.md)
