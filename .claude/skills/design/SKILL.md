---
name: design
description: Produce a structured implementation plan for a new feature or change in the Collaborative Notes App BEFORE writing code. Walks the full stack — data model, API, frontend, docs — grounded in the project's docs/. Use when the user wants to build a feature, add an endpoint/page, or change behavior and hasn't yet nailed down the design.
---

# /design — Plan before building

You are producing a **design/plan**, not code. The goal is a concrete, docs-grounded plan the user approves before implementation. Do not edit source files during this skill.

## Steps

1. **Understand the ask.** Restate the feature in one or two sentences. If requirements are ambiguous (fields, behavior, edge cases), ask 1–3 focused questions before planning.

2. **Read the relevant docs** so the plan matches real patterns. Always skim [CLAUDE.md](../../../CLAUDE.md) and [docs/ARCHITECTURE.md](../../../docs/ARCHITECTURE.md); then pull the specific docs via the routing table (e.g. [docs/backend/SERVICES.md](../../../docs/backend/SERVICES.md), [docs/frontend/STATE_MANAGEMENT.md](../../../docs/frontend/STATE_MANAGEMENT.md), [docs/guides/ADD_FEATURE.md](../../../docs/guides/ADD_FEATURE.md)).

3. **Produce the plan** with these sections (skip any that genuinely don't apply, and say why):

   - **Data model** — entities/columns to add or change (UUID PK, timestamps, explicit types, `@IsIn` unions). Note that new entities register in *two* places and that `synchronize: true` means a restart, not a migration. Ref [docs/DATA_MODEL.md](../../../docs/DATA_MODEL.md).
   - **API** — endpoints (method, path, DTOs, status codes, error cases). Call out anything touching the **optimistic-locking / 409 conflict contract**. Ref [docs/API_CONTRACTS.md](../../../docs/API_CONTRACTS.md).
   - **Backend** — module/controller/service/DTO changes, in pseudocode. Thin controller, logic in service, NestJS exceptions.
   - **Frontend** — types, `api/` functions, pages/components, state (local only), loading/error/empty states, toasts, styling tokens, motion.
   - **Docs to update** — the exact files from the "Keeping Docs in Sync" table in [CLAUDE.md](../../../CLAUDE.md).
   - **Dependencies** — call out ANY new npm package explicitly; these require user approval before implementation.
   - **Risks / open questions** — conflict-contract impacts, `synchronize` implications, no-auth assumptions, anything that changes existing behavior.

4. **Present as a numbered, ordered implementation checklist** the user can approve or adjust. End by asking whether to proceed to implementation.

## Guardrails

- Reuse existing patterns; do not introduce new architecture (state libraries, ORMs, error envelopes) unless the user explicitly asks — flag it as a decision if tempted.
- No new dependencies without approval.
- Don't propose editing `docker-compose*.yml`, Dockerfiles, or nginx configs unless the task truly requires it (and then flag it).
- Keep the plan proportional to the task — a one-endpoint change gets a short plan.
