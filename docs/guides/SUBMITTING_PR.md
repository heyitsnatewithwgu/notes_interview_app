# Guide: Submitting a PR

What to check before opening a pull request. Conventions: [CONVENTIONS.md](../CONVENTIONS.md#git-conventions-team-process).

## Branch & commits

- Branch off `main`: `feature/<desc>`, `fix/<desc>`, or `chore/<desc>`.
- Commits in imperative mood, one logical change each: "Add tag filtering to notes list".
- One feature/fix per PR.

## Pre-flight checks

Run the same checks CI enforces (see [../platform/CI_CD.md](../platform/CI_CD.md)):

```bash
# Frontend
cd frontend
npm run lint          # ESLint must pass
npm run test:cov      # Vitest + coverage (fails under 70%)
npm run build         # tsc -b && vite build must succeed

# Backend
cd backend
npx tsc --noEmit      # type-check (no backend lint script)
npm run test:cov      # Jest + coverage (fails under 70%)
npm run build         # tsc → dist must succeed

# E2E (CI runs @smoke on PRs) — needs the stack up:
#   docker compose -f docker-compose.dev.yml up -d
#   cd e2e && npm ci && npm run install:browsers && npm test
```

Then smoke-test the real flow in the dev stack ([platform/DOCKER.md](../platform/DOCKER.md)):

```bash
docker compose -f docker-compose.dev.yml up --build
```

Exercise the paths your change touches — CRUD, error/empty states, and (if relevant) the conflict-resolution dialog.

## Merge gate

`main` is protected by a repository ruleset: a PR needs **1 approving review** and **green CI** (including the **≥70% coverage** gate and code quality) to merge, and **direct pushes are blocked**. Admins can bypass in emergencies only. See [../platform/BRANCH_PROTECTION.md](../platform/BRANCH_PROTECTION.md).

## Docs sync (required)

Keeping docs accurate is part of the change, not a follow-up. Match your change to the doc-sync table in the root [CLAUDE.md](../../CLAUDE.md). Quick map:

| You changed | Update |
|-------------|--------|
| An endpoint / request-response shape | [API_CONTRACTS.md](../API_CONTRACTS.md) |
| An entity / column | [DATA_MODEL.md](../DATA_MODEL.md) (+ frontend type) |
| An env var | [ENV_VARS.md](../ENV_VARS.md) + `.env.example` + compose |
| Added files/dirs | the relevant folder `CLAUDE.md` tree ([backend](../../backend/CLAUDE.md) / [frontend](../../frontend/CLAUDE.md)) |
| A new `ui/` primitive | [frontend/COMPONENTS.md](../frontend/COMPONENTS.md) |
| A new hook | [frontend/HOOKS.md](../frontend/HOOKS.md) |
| Established a new pattern | the matching area doc |

## PR description

Include:
- **What** changed and **why**.
- How you tested it (commands run, flows exercised).
- Any behavior change, new dependency (should have been pre-approved), or follow-up.
- Screenshots/GIFs for UI changes.

## Checklist

- [ ] Branch named by convention; focused scope
- [ ] Lint + build pass; both packages type-check/build
- [ ] **Tests added/updated; `npm run test:cov` passes (≥70%) in each affected package**
- [ ] New user-facing flow has a Playwright spec in `e2e/`
- [ ] Smoke-tested in the dev stack (incl. error/empty/conflict paths you touched)
- [ ] Docs updated per the table above
- [ ] No new dependencies without prior approval
- [ ] No secrets/credentials committed
- [ ] 1 approving review obtained (ruleset requirement)
- [ ] Considered running the `/review` skill

> Consider running the **`/review`** skill before opening the PR — it checks docs sync, validation, error handling, the conflict contract, styling/accessibility, and the no-new-deps rule.
