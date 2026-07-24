# Environment Variables

Every environment variable the app reads, where it's read, and its default. Template: [.env.example](../.env.example).

## Backend

Read via `@nestjs/config` `ConfigService` in [backend/src/app.module.ts](../backend/src/app.module.ts). **Every one has an inline default**, so the backend boots with zero env vars set (using `localhost`/`postgres`/`notes`).

| Variable | Default | Used for |
|----------|---------|----------|
| `DB_HOST` | `localhost` | Postgres host. Set to `postgres` (the service name) inside Docker. |
| `DB_PORT` | `5432` | Postgres port. |
| `DB_USERNAME` | `postgres` | Postgres user. |
| `DB_PASSWORD` | `postgres` | Postgres password. |
| `DB_DATABASE` | `notes` | Database name. |
| `DB_SYNCHRONIZE` | `'true'` | TypeORM auto-schema-sync. **String**, compared with `=== 'true'`. Set to any other value (e.g. `"false"`) to disable. |

```typescript
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
```

> **Not env-driven:** the HTTP port is **hardcoded to `3000`** in [backend/src/main.ts](../backend/src/main.ts) (`await app.listen(3000)`). Changing it requires a code edit, not an env var.

## Frontend

Vite exposes only variables prefixed `VITE_`, inlined **at build time** (not runtime). Read via `import.meta.env`.

| Variable | Default | Used for |
|----------|---------|----------|
| `VITE_API_URL` | `http://localhost:3000` | Base URL for all API calls, in [frontend/src/api/notes.ts](../frontend/src/api/notes.ts). |

```typescript
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';
```

Because it's build-time, the production frontend image takes it as a Docker **build arg** (`docker-compose.yml` → `frontend.build.args.VITE_API_URL`), not a runtime env var. In dev it's a normal env var on the frontend container.

## Postgres container

The `postgres` service in both compose files maps the same values to the official image's own variables:

```yaml
environment:
  POSTGRES_USER: ${DB_USERNAME:-postgres}
  POSTGRES_PASSWORD: ${DB_PASSWORD:-postgres}
  POSTGRES_DB: ${DB_DATABASE:-notes}
```

The `${VAR:-default}` syntax reads from your shell/`.env` and falls back to the default. `DB_HOST`, `DB_PORT`, and `DB_SYNCHRONIZE` are set directly on the backend service in compose, **not** in `.env.example`.

## `.env.example`

```bash
# Database
DB_USERNAME=postgres
DB_PASSWORD=your_secure_password_here
DB_DATABASE=notes

# Frontend
VITE_API_URL=http://localhost:3000
```

Copy to `.env` at the repo root for Docker Compose to pick up. `.env*` files are gitignored.

## Adding a new variable

1. Read it via `ConfigService.get('NAME', default)` (backend) or `import.meta.env.VITE_NAME` (frontend — must have the `VITE_` prefix).
2. Add it to the relevant service in `docker-compose.yml` / `docker-compose.dev.yml` (as a build arg for frontend, env for backend).
3. Add it (with a safe placeholder) to `.env.example`.
4. **Update this file.**
