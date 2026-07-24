# Docker & Local Development

The app runs entirely in Docker Compose. There are two compose files — a dev stack (hot reload, ports exposed) and a prod stack (built images, reverse proxy). Topology overview: [ARCHITECTURE.md](../ARCHITECTURE.md#runtime-topology-dev-vs-prod).

## Quick start (development)

```bash
cp .env.example .env                                    # optional; defaults work
docker compose -f docker-compose.dev.yml up --build
```

- Frontend (Vite): http://localhost:5173
- Backend (NestJS): http://localhost:3000
- Postgres: localhost:5432 (`postgres` / `postgres` / db `notes`)

Source is bind-mounted, so edits hot-reload (Vite HMR on the frontend, `nodemon` on the backend).

```bash
docker compose -f docker-compose.dev.yml down          # stop
docker compose -f docker-compose.dev.yml down -v       # stop + wipe DB volume
```

## Production stack

```bash
docker compose up --build
```

- App (frontend nginx): http://localhost:80
- API entrypoint (reverse-proxy nginx): http://localhost:3000 → `backend:3000`
- Backend and Postgres have **no host ports** — internal to `app-network`.

## Services

### `docker-compose.dev.yml`

| Service | Image / build | Host port | Notes |
|---------|---------------|-----------|-------|
| postgres | `postgres:16-alpine` | 5432 | volume `postgres_data_dev`; `pg_isready` healthcheck |
| backend | `./backend` target `development` | 3000 | `npm run start:dev` (nodemon+ts-node); bind-mount `./backend` + anon `node_modules` |
| frontend | `./frontend` target `development` | 5173 | `npm run dev -- --host`; bind-mount `./frontend` + anon `node_modules` |

No nginx in dev — the browser hits the backend directly on `:3000`.

### `docker-compose.yml` (prod)

| Service | Image / build | Host port | Notes |
|---------|---------------|-----------|-------|
| postgres | `postgres:16-alpine` | — | volume `postgres_data` |
| backend | `./backend` target `production` | — | `node dist/main.js`; `DB_SYNCHRONIZE: "true"` |
| frontend | `./frontend` target `production` (build arg `VITE_API_URL`) | 80 | nginx serving `dist/` |
| nginx | `nginx:alpine` | 3000 | reverse proxy → `backend:3000` (mounts `nginx/nginx.conf`) — see [NGINX.md](NGINX.md) |

Both files define the `app-network` bridge and set Postgres creds from `${DB_*:-default}` ([ENV_VARS.md](../ENV_VARS.md)).

## Dockerfiles (multi-stage)

### `backend/Dockerfile` — `node:20-alpine`
- **development**: `npm ci`, copy source, `CMD npm run start:dev`.
- **build**: `npm ci`, `npm run build` → `dist/`.
- **production**: `npm ci --only=production`, copy `dist/` from build, `EXPOSE 3000`, `CMD node dist/main.js`.

### `frontend/Dockerfile`
- **development** (`node:20-alpine`): `EXPOSE 5173`, `CMD npm run dev -- --host`.
- **build** (`node:20-alpine`): `ARG VITE_API_URL=http://localhost:3000` → `ENV` → `npm run build`. **`VITE_API_URL` is baked in here**, at build time.
- **production** (`nginx:alpine`): copy `dist/` → `/usr/share/nginx/html`, copy `frontend/nginx.conf`, `EXPOSE 80`.

## Common commands

```bash
# Logs / shell
docker compose -f docker-compose.dev.yml logs -f backend
docker compose -f docker-compose.dev.yml exec backend sh

# psql
docker compose -f docker-compose.dev.yml exec postgres psql -U postgres -d notes

# Rebuild one service
docker compose -f docker-compose.dev.yml up --build backend
```

More diagnosis: [../guides/DEBUGGING.md](../guides/DEBUGGING.md).

## Rules

- **Do not modify `docker-compose*.yml`, the Dockerfiles, or nginx configs unless explicitly asked** (root [CLAUDE.md](../../CLAUDE.md)).
- Changing `VITE_API_URL` requires a **frontend rebuild** (build-time bake), not a restart.
