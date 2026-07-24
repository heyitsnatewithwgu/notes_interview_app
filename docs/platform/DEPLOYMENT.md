# Deployment

> **Current state:** CI runs on GitHub Actions (lint, tests + coverage, E2E, security scans), and a **stubbed** OIDC deploy workflow exists ([OIDC_DEPLOY.md](OIDC_DEPLOY.md)) — but **no cloud target is wired**. "Deployment" today means **running the production Docker Compose stack** on a host. This doc covers that plus the changes required before a real production deployment; see [CI_CD.md](CI_CD.md) for the pipeline.

## Production stack (what exists)

```bash
# On the host, from the repo root:
cp .env.example .env         # set real values (see below)
docker compose up --build -d
```

This builds and starts four services ([DOCKER.md](DOCKER.md)):

- `frontend` (nginx) on `:80` — the app
- `nginx` (reverse proxy) on `:3000` — the API entrypoint → `backend:3000` ([NGINX.md](NGINX.md))
- `backend` (NestJS) — internal only
- `postgres` — internal only, data in the `postgres_data` volume

Build order matters for the frontend: `VITE_API_URL` is a **build arg** baked in at image build ([ENV_VARS.md](../ENV_VARS.md)). Point it at the public API origin **before** building:

```bash
VITE_API_URL=https://api.example.com docker compose build frontend
```

## Required changes before real production

These are **not** in place today. Address them (proposing first — see root [CLAUDE.md](../../CLAUDE.md)) before exposing this publicly:

| Area | Today | Needed |
|------|-------|--------|
| **Schema** | `DB_SYNCHRONIZE="true"` in compose | Set `false` + adopt TypeORM migrations — `synchronize` can rewrite/drop columns. See [DATA_MODEL.md](../DATA_MODEL.md#schema-management). |
| **Secrets** | default `postgres`/`postgres` | Strong `DB_PASSWORD` via a secret store; never commit real values. |
| **Auth** | none | Add authn/authz before public exposure. [../guides/SECURITY.md](../guides/SECURITY.md). |
| **TLS** | plain HTTP | Terminate HTTPS (reverse proxy / load balancer / cert). |
| **CORS** | localhost origins in `main.ts` | Add the production frontend origin. |
| **Backups** | none | Back up the Postgres volume/database. |
| **CI/CD** | Actions: lint, tests+coverage, E2E, security; **stubbed** OIDC deploy | Un-stub the deploy ([OIDC_DEPLOY.md](OIDC_DEPLOY.md)) — wire the AWS role + ECR/ECS. |
| **Observability** | console logs | Structured logging + healthcheck monitoring. |
| **Tests** | unit/E2E/regression/smoke; ~89%/~91% coverage, 70% gate | Maintained — [../guides/TESTING.md](../guides/TESTING.md). |

## Health & smoke check

```bash
docker compose ps                          # all services healthy/up
curl -i http://<host>:3000/notes           # API reachable via proxy → 200 []
curl -i http://<host>:80/                  # SPA served → 200 index.html
docker compose logs -f backend             # boot + request logs
```

## Build artifacts

- Backend prod image compiles TS to `dist/` and runs `node dist/main.js` (no `ts-node` in prod).
- Frontend prod image serves the static Vite `dist/` via nginx; there is no Node process in the frontend container.

## Rules

- **Don't modify compose files, Dockerfiles, or nginx configs unless explicitly asked.**
- Any deploy-hardening change (migrations, TLS, auth, secrets) alters behavior/infra — **propose before implementing**, and update this doc plus [DATA_MODEL.md](../DATA_MODEL.md) / [../guides/SECURITY.md](../guides/SECURITY.md) when you do.
