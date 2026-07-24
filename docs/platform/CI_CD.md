# CI/CD

All automation lives in [.github/workflows/](../../.github/workflows/). Five workflows run on pull requests and pushes to `main`; together they satisfy the merge gates in the repository ruleset ([BRANCH_PROTECTION.md](BRANCH_PROTECTION.md)).

## Workflows at a glance

| Workflow | File | Triggers | What it does |
|----------|------|----------|--------------|
| **Frontend CI** | `frontend-ci.yml` | PR + push to `main` (paths: `frontend/**`) | ESLint, `tsc`/build, Vitest **+ coverage upload** |
| **Backend CI** | `backend-ci.yml` | PR + push to `main` (paths: `backend/**`) | `tsc`, build, Jest **+ coverage upload** |
| **E2E** | `e2e.yml` | PR + push + dispatch | Boots the stack, Playwright **smoke on PR / full on push** |
| **Security Scan** | `security-scan.yml` | PR + push to `main` | gitleaks (secrets) + Trivy (image CVEs) |
| **Deploy** | `deploy.yml` | push to `main` + dispatch | **Stubbed** OIDC → AWS deploy ([OIDC_DEPLOY.md](OIDC_DEPLOY.md)) |

## How CI maps to the ruleset gates

The ruleset blocks a merge unless these pass ([BRANCH_PROTECTION.md](BRANCH_PROTECTION.md)):

| Ruleset gate | Fed by |
|--------------|--------|
| **Code coverage ≥70%, ≤5% drop** | The `test` jobs in Frontend/Backend CI produce **Cobertura XML** and upload it to GitHub Code Quality via `actions/upload-code-coverage@v1`. |
| **Code quality (errors)** | GitHub **Code Quality** (CodeQL), enabled in repo settings — runs automatically, no workflow needed. |
| **1 approving review, no force-push, etc.** | GitHub-native (not a workflow). |

Both CI workflows also run on **push to `main`** (not just PRs) so GitHub has a default-branch coverage **baseline** to compute the "max 5% drop" against.

## Coverage upload detail

Each `test` job:
1. runs `npm run test:cov` — Jest/Vitest with a hard **70% threshold** (so CI fails locally-equivalently) — emitting `coverage/cobertura-coverage.xml`;
2. uploads it:
   ```yaml
   - name: Upload coverage to GitHub Code Quality
     if: >-
       github.event_name != 'pull_request' ||
       github.event.pull_request.head.repo.full_name == github.repository
     continue-on-error: true
     uses: actions/upload-code-coverage@v1
     with:
       file: backend/coverage/cobertura-coverage.xml
       language: TypeScript
       label: code-coverage/backend
   ```

Notes:
- The `if:` skips upload for **fork** PRs (they lack the token permission) — same-repo PRs and pushes upload normally.
- `continue-on-error: true` keeps the upload **best-effort**: the hard gate is the in-runner 70% threshold, so a coverage-service hiccup never blocks a green build. The ruleset still evaluates whatever was uploaded.
- Requires **GitHub Code Quality to be enabled** for the repo (Settings → Security → Code quality). See [BRANCH_PROTECTION.md](BRANCH_PROTECTION.md#prerequisite-enable-github-code-quality).

## E2E in CI

`e2e.yml` brings the whole stack up with `docker compose -f docker-compose.dev.yml up -d --build`, waits for `:3000` and `:5173`, installs Playwright + Chromium, then runs:
- **`@smoke` only** on pull requests (fast feedback),
- **the full suite** on push to `main` and manual dispatch.

The Playwright HTML report is uploaded as an artifact; the stack is torn down with `down -v` afterwards.

## Running the same checks locally

```bash
cd frontend && npm run lint && npm run build && npm run test:cov
cd backend  && npx tsc --noEmit && npm run build && npm run test:cov
# E2E (stack must be up):
docker compose -f docker-compose.dev.yml up -d
cd e2e && npm ci && npm run install:browsers && npm test
```

## Rules

- **Do not modify workflows** (or the ruleset) without asking — they gate everyone's merges. This is in the root [CLAUDE.md](../../CLAUDE.md) critical rules.
- Keep coverage above 70% by **adding tests**, never by lowering a threshold ([TESTING.md](../guides/TESTING.md)).
- New user-facing flows get a Playwright spec; tag it `@smoke` if it belongs in the per-PR set.
