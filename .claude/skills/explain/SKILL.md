---
name: explain
description: Explain a file, flow, concept, or the overall architecture of the Collaborative Notes App in plain English, with pointers into docs/. Use when someone asks "how does X work", "what does this file do", "walk me through the conflict handling", or needs to understand the codebase without deep TypeScript/NestJS/React knowledge.
---

# /explain — Understand the code

Explain the requested code or concept clearly, for a reader who may not be deeply technical (e.g. a PM). Ground the explanation in the actual code and the docs.

## Steps

1. **Scope it.** Identify what to explain: a specific file, a flow (e.g. autosave, conflict resolution, reorder), a concept (e.g. optimistic locking, DTO validation), or the whole architecture. If unclear, ask.

2. **Read the source and the matching doc.** Use the routing table in [CLAUDE.md](../../../CLAUDE.md) to find the right doc, and open the real files so the explanation is accurate — never guess.

3. **Explain in layers:**
   - **One-sentence summary** — what it is / does.
   - **Why it exists** — the problem it solves in this app.
   - **How it works** — step by step, in plain language. Use a short diagram or numbered flow for multi-step processes. Reference real names (`NotesService.update`, `handleResponse`, `useDebounce`) so the reader can find them.
   - **How it connects** — what calls it, what it calls, where backend and frontend meet (especially the `expectedUpdatedAt` / `409` contract).
   - **Caveats** — anything surprising or intentionally simplified (e.g. `version` column is unused, `synchronize: true` = no migrations, no auth, dark mode isn't `next-themes`).

4. **Point to the docs** for deeper reading (link the specific files).

## Style

- Plain English first; show code only when a small snippet clarifies (keep it short and real).
- Define jargon on first use (DTO, optimistic locking, SPA, reverse proxy).
- Prefer analogies for hard concepts (e.g. optimistic locking ≈ "check the version stamp before saving so you don't overwrite someone else's edit").
- Be honest about the app's simplifications — don't oversell it as production-grade.
- Do not modify code during this skill.
