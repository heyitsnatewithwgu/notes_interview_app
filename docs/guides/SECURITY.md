# Guide: Security

> **Context:** this is an interview/demo app with **no authentication and no authorization** — every note is world-readable and world-writable. That's an accepted scope decision, not an oversight. This guide documents (a) the security-relevant behavior that *does* exist, and (b) what to add before any real deployment. Don't silently "harden" things in ways that break the demo; discuss changes that alter behavior.

## What already protects the app

- **Input validation.** The global `ValidationPipe({ whitelist: true, transform: true })` validates every body against a DTO and **strips unknown fields**, so clients can't set server-managed columns (`id`, `version`, timestamps) or inject extra properties. See [backend/DTOS_VALIDATION.md](../backend/DTOS_VALIDATION.md).
- **CORS allow-list.** Only the configured frontend origins may call the API ([backend/src/main.ts](../../backend/src/main.ts)). Credentials are not enabled.
- **Parameterized data access.** TypeORM repository methods parameterize queries. Keep it that way — if you use `createQueryBuilder`, always bind values (`:param`), never string-concatenate input ([backend/SERVICES.md](../backend/SERVICES.md)).
- **UUID ids.** Non-sequential, non-guessable primary keys.
- **Optimistic locking.** Prevents silent lost updates on concurrent edits ([ARCHITECTURE.md](../ARCHITECTURE.md#the-signature-flow-optimistic-locking-conflict-resolution)).

## Known gaps (address before production)

| Gap | Impact | Direction |
|-----|--------|-----------|
| **No auth** | Anyone can CRUD any note | Add authentication (JWT via `@nestjs/jwt`, or sessions) + `@UseGuards` on controllers; scope notes to an owner. |
| **No authorization / ownership** | No per-user data isolation | Add an `ownerId` column and check it in the service; add a guard. |
| **`synchronize: true` in prod** | Schema auto-alter can drop/rewrite columns | Set `DB_SYNCHRONIZE=false` and adopt TypeORM migrations before prod. See [DATA_MODEL.md](../DATA_MODEL.md#schema-management), [platform/DEPLOYMENT.md](../platform/DEPLOYMENT.md). |
| **No rate limiting** | Abuse / brute force | Add `@nestjs/throttler`. |
| **No security headers** | XSS/clickjacking surface | Add `helmet` in `main.ts`. |
| **No request size / body limits** | DoS via large payloads | Configure body/payload limits. |
| **Default DB credentials** | `postgres`/`postgres` | Set strong `DB_PASSWORD` via secrets, never commit real values (`.env` is gitignored; `.env.example` holds placeholders). |
| **No structured logging/audit** | Hard to investigate incidents | Add request logging. |

Each of these adds a dependency and/or changes behavior — **propose before implementing** (root [CLAUDE.md](../../CLAUDE.md) forbids unsanctioned deps and behavior changes).

## Rules for new code

1. **Validate every input** with a DTO — no raw `@Body()` object access.
2. **Never concatenate user input into SQL**; use parameterized query-builder values or repository methods.
3. **Don't leak internals** in error messages (stack traces, SQL). NestJS defaults are fine; keep custom messages generic ([backend/ERROR_HANDLING.md](../backend/ERROR_HANDLING.md)).
4. **No secrets in code or git.** Read via `ConfigService`; add placeholders to `.env.example` ([ENV_VARS.md](../ENV_VARS.md)).
5. **When you add auth**, require it by default and mark public routes explicitly.
6. Run a review before shipping anything security-relevant — the `/review` skill flags several of these.
