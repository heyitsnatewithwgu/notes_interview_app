# Branch Protection & Repository Ruleset

The repository is governed by a GitHub **ruleset** named **"main branch protection"** (`enforcement: active`). It defines the merge gates every change must clear. CI is built to satisfy these gates — see [CI_CD.md](CI_CD.md).

> Rulesets are the modern replacement for classic "branch protection rules." They're managed in **Settings → Rules → Rulesets**, versioned, and exportable as JSON (the export is reproduced at the bottom of this doc).

## What it enforces

The ruleset targets branches and (via `~ALL` + `~DEFAULT_BRANCH`) applies to **all branches**, with the real intent being to protect `main`.

| Rule | Effect |
|------|--------|
| **Require a pull request** | Changes must land via PR — **no direct pushes**. Requires **1 approving review**. `merge`, `squash`, and `rebase` are all allowed. Stale reviews are **not** auto-dismissed on new pushes; no code-owner review is required. |
| **Block force-pushes** (`non_fast_forward`) | History can't be rewritten on protected branches. |
| **Block deletion** | Protected branches can't be deleted. |
| **Restrict creation / update** | Branch create/update is governed by the ruleset (so the PR + status gates apply). |
| **Code quality** (`severity: errors`) | GitHub **Code Quality** (CodeQL) must report no findings at **error** severity. |
| **Code coverage** | PR coverage must be **≥ 70%** (`minimum_coverage`) and drop **no more than 5 points** vs. the default branch (`max_coverage_drop`). |

### Bypass
The **Repository Admin** role (`actor_id: 5`, `RepositoryRole`) has `bypass_mode: always` — admins can merge without satisfying the rules. This is the escape hatch for emergencies; **use it sparingly** and never to skip failing tests on normal work.

## How each gate is satisfied

| Gate | Mechanism | Reference |
|------|-----------|-----------|
| PR + 1 review, no force-push/deletion | GitHub-native; nothing to run | — |
| **Code coverage ≥70% / ≤5% drop** | Frontend/Backend CI produce **Cobertura XML** and upload it to GitHub Code Quality (`actions/upload-code-coverage@v1`). Both also run on **push to `main`** to set the baseline. | [CI_CD.md](CI_CD.md#coverage-upload-detail), [../guides/TESTING.md](../guides/TESTING.md) |
| **Code quality (errors)** | GitHub Code Quality runs CodeQL automatically once enabled | below |

The in-repo test runners are configured with a **hard 70% threshold** too (`coverageThreshold` in `backend/jest.config.js`, `test.coverage.thresholds` in `frontend/vite.config.ts`), so `npm run test:cov` fails locally the same way the gate does — you find out before you push.

## Prerequisite: enable GitHub Code Quality

The `code_coverage` and `code_quality` rules only function when **GitHub Code Quality** is enabled:

1. An enterprise/org owner must allow Code Quality.
2. Repo **Settings → Security → Code quality → Enable code quality** (this also wires the automatic CodeQL runs that back the `code_quality` rule).
3. Once enabled, the CI coverage uploads flow into it and the ruleset can evaluate PRs.

Until Code Quality is enabled, the coverage/quality **rules have no data to evaluate** — the CI still runs and enforces its own 70% threshold, and admins can bypass. The upload step is `continue-on-error`, so this never hard-fails a build.

## The PR flow this creates

```
branch off main ─► push ─► open PR ─► CI runs (lint, build, tests+coverage, e2e smoke, security)
   │                                       │
   │                                       ├─ coverage uploaded → coverage gate evaluated
   │                                       ├─ CodeQL (Code Quality) → quality gate evaluated
   │                                       └─ 1 approving review required
   └────────────────────────────► all gates green ─► squash/merge/rebase into main
```

See [../guides/SUBMITTING_PR.md](../guides/SUBMITTING_PR.md) for the contributor checklist.

## Reproducing / editing the ruleset

Rulesets are managed in **Settings → Rules → Rulesets** (UI) or via the REST API (`/repos/{owner}/{repo}/rulesets`). To reproduce this one, import the JSON below or recreate the rules in the table above. **Don't change enforcement, thresholds, or bypass actors without asking** — it governs everyone's merges.

<details>
<summary>Exported ruleset JSON</summary>

```json
{
  "name": "main branch protection",
  "target": "branch",
  "enforcement": "active",
  "conditions": { "ref_name": { "exclude": [], "include": ["~DEFAULT_BRANCH", "~ALL"] } },
  "rules": [
    { "type": "deletion" },
    { "type": "non_fast_forward" },
    { "type": "creation" },
    { "type": "update" },
    { "type": "pull_request", "parameters": {
        "required_approving_review_count": 1,
        "dismiss_stale_reviews_on_push": false,
        "require_code_owner_review": false,
        "require_last_push_approval": false,
        "required_review_thread_resolution": false,
        "allowed_merge_methods": ["merge", "squash", "rebase"] } },
    { "type": "code_quality", "parameters": { "severity": "errors" } },
    { "type": "code_coverage", "parameters": { "minimum_coverage": 70, "max_coverage_drop": 5 } }
  ],
  "bypass_actors": [ { "actor_id": 5, "actor_type": "RepositoryRole", "bypass_mode": "always" } ]
}
```
</details>

## Rules
- Keep CI green and coverage ≥70% by **adding tests**, not by lowering thresholds or leaning on admin bypass.
- Treat the ruleset as protected config — propose changes, don't apply them unilaterally.
