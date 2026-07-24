---
name: review
description: Review pending changes in the Collaborative Notes App before a PR. Checks docs-sync, DTO validation, NestJS error handling, the optimistic-locking/conflict contract, frontend patterns (API client, states, styling, a11y), protected-file edits, and the no-new-dependencies rule. Use before opening a PR or when the user asks for a code review of their working changes.
---

# /review — Pre-PR review

Review the working changes against this project's rules and report findings. Read the diff and the affected files; consult the docs to judge correctness.

## What to inspect

Start from the diff:

```bash
git status
git diff            # unstaged
git diff --staged   # staged
```

Read [CLAUDE.md](../../../CLAUDE.md) and the docs for any area the diff touches.

## Checklist

**Protected files & dependencies**
- [ ] No edits to `docker-compose*.yml`, `Dockerfile`s, nginx configs, `.github/workflows/`, or the ruleset (unless the task explicitly called for it).
- [ ] No new npm dependencies in `backend/package.json` or `frontend/package.json` without approval (a shadcn primitive's Radix dep is acceptable).

**Docs sync** (per the "Keeping Docs in Sync" table in [CLAUDE.md](../../../CLAUDE.md))
- [ ] Endpoint changes → [docs/API_CONTRACTS.md](../../../docs/API_CONTRACTS.md) updated.
- [ ] Entity/column changes → [docs/DATA_MODEL.md](../../../docs/DATA_MODEL.md) **and** frontend `types/` updated.
- [ ] New env var → [docs/ENV_VARS.md](../../../docs/ENV_VARS.md) + `.env.example` + compose.
- [ ] New files/dirs → the relevant folder `CLAUDE.md` tree; new `ui/` primitive → [docs/frontend/COMPONENTS.md](../../../docs/frontend/COMPONENTS.md); new hook → [docs/frontend/HOOKS.md](../../../docs/frontend/HOOKS.md).

**Backend**
- [ ] Controllers stay thin; logic in services.
- [ ] Request bodies are DTOs with `class-validator`; no raw `@Body()` access.
- [ ] Errors use NestJS exceptions (`NotFoundException`, `ConflictException`); no ad-hoc error returns.
- [ ] New entities registered in **both** `entities: [...]` and `TypeOrmModule.forFeature([...])`.
- [ ] Query-builder input is parameterized (`:param`), never concatenated.
- [ ] Handlers that can reject are `async` + `await`ed/returned (see [docs/backend/ERROR_HANDLING.md](../../../docs/backend/ERROR_HANDLING.md)).

**Conflict contract (both sides)**
- [ ] `PUT` still enforces `expectedUpdatedAt` vs. `updatedAt`.
- [ ] The `409` body shape `{ message, currentNote }` is unchanged, or changed on **both** backend and frontend together.

**Frontend**
- [ ] API calls go through `src/api/*` via `handleResponse<T>()`; no `fetch` in components.
- [ ] Data views handle loading / error / empty / content; errors show a `sonner` toast.
- [ ] Semantic Tailwind tokens + `cn()`; dark mode via tokens/`dark:` (not `next-themes`); icons from lucide; motion consistent.
- [ ] `@/` imports and `import type` for types; no deep relative paths.
- [ ] Icon-only buttons have `title`/`sr-only`; keyboard-operable.

**Tests & build**
- [ ] Tests added/updated for the change; `npm run test:cov` passes (≥70%) in each affected package ([docs/guides/TESTING.md](../../../docs/guides/TESTING.md)).
- [ ] New user-facing flow has a Playwright spec in `e2e/`.
- [ ] `cd frontend && npm run lint && npm run build` passes.
- [ ] `cd backend && npx tsc --noEmit && npm run build` passes.

## Output

Group findings by severity: **🔴 Must fix** (breaks a contract/rule/build), **🟡 Should fix** (pattern/quality), **🟢 Nice to have**. For each: the file/line, what's wrong, and the concrete fix. If everything passes, say so and list what you verified. Offer to apply the fixes.
