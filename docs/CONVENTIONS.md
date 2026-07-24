# Coding Conventions

Standards that apply across the whole repo. These describe what the code **actually does today** — follow them so new code matches existing code. Area-specific patterns live in [backend/](backend/) and [frontend/](frontend/).

## Language & tooling

| | Backend | Frontend |
|---|---------|----------|
| Language | TypeScript 5.9 (CommonJS) | TypeScript 5.9 (ESM) |
| Runtime/build | `ts-node` (dev), `tsc` → `dist/` (prod) | Vite 7 (`tsc -b && vite build`) |
| Linter | **none configured** | ESLint 9 flat config (`npm run lint`) |
| Formatter | **none configured** | **none configured** (no Prettier) |
| Strictness | `strictNullChecks`, `noImplicitAny` (not full `strict`) | full `strict` + `noUnusedLocals`/`noUnusedParameters` |
| Tests | Jest + supertest (`npm test` / `test:cov`) | Vitest + Testing Library (`npm test` / `test:cov`) |

> There is no Prettier config and no backend linter in this repo. Match the **observed** style rather than relying on an autoformatter: 2-space indentation, single quotes, semicolons, trailing commas in multiline literals.

Do **not** add ESLint/Prettier/Husky or any new dependency without asking first — see the critical rules in the root [CLAUDE.md](../CLAUDE.md).

## File & symbol naming

### Backend (NestJS)

Files are **kebab-case** with a role suffix; classes are **PascalCase**.

| Artifact | File | Class |
|----------|------|-------|
| Module | `<feature>.module.ts` | `<Feature>Module` |
| Controller | `<feature>.controller.ts` | `<Feature>Controller` |
| Service | `<feature>.service.ts` | `<Feature>Service` |
| Entity | `entities/<feature>.entity.ts` | `<Feature>` (singular) |
| Create DTO | `dto/create-<feature>.dto.ts` | `Create<Feature>Dto` |
| Update DTO | `dto/update-<feature>.dto.ts` | `Update<Feature>Dto` |

Example from the codebase: `notes.controller.ts` → `NotesController`, `entities/note.entity.ts` → `Note`, `dto/create-note.dto.ts` → `CreateNoteDto`.

### Frontend (React)

| Artifact | File | Export |
|----------|------|--------|
| Component (feature) | `PascalCase.tsx` (`NoteCard.tsx`) | named export `NoteCard` |
| Component (shadcn/ui) | `kebab-or-lower.tsx` in `components/ui/` (`button.tsx`) | named export `Button` |
| Page | `PascalCase.tsx` in `pages/` (`NotesList.tsx`) | named export |
| Hook | `use-<name>.ts` (`use-debounce.ts`) | named `useDebounce` |
| Utility / types | kebab-case (`utils.ts`, `note.ts`) | named exports |
| Props interface | `<Component>Props` (`NoteCardProps`) | — |

Icons are always from `lucide-react`. Never introduce another icon library.

## Imports

- **Frontend:** always use the `@/` path alias (maps to `frontend/src/`), never deep relative paths like `../../components`. Configured in `vite.config.ts` and `tsconfig.app.json`.
  ```typescript
  import { Button } from '@/components/ui/button';
  import type { Note } from '@/types/note';
  ```
  Use `import type { ... }` for type-only imports — `verbatimModuleSyntax` is on, so this is enforced.
- **Backend:** relative imports within `src/` (`./dto/create-note.dto`, `./entities/note.entity`). No path alias is configured despite `tsconfig-paths` being registered.

## HTTP / API conventions

- Base path per resource, plural, **no version prefix and no trailing slash**: `/notes`, `/notes/:id`.
- Collection-level custom actions use a sub-path: `PATCH /notes/reorder`.
- Verbs map to HTTP methods: `GET` (read), `POST` (create), `PUT` (full update), `PATCH` (partial/action), `DELETE` (remove).
- Frontend API functions are camelCase verbs mirroring the endpoint: `fetchNotes`, `fetchNote`, `createNote`, `updateNote`, `reorderNotes`, `deleteNote` — all in [frontend/src/api/notes.ts](../frontend/src/api/notes.ts).

Full endpoint catalog: [API_CONTRACTS.md](API_CONTRACTS.md).

## Database conventions

- **UUID** primary keys (`@PrimaryGeneratedColumn('uuid')`).
- Every entity carries `@CreateDateColumn() createdAt` and `@UpdateDateColumn() updatedAt`.
- Explicit column `type` + `default` for non-string columns.
- Schema is applied by `synchronize: true` — **no migration files exist**. See [DATA_MODEL.md](DATA_MODEL.md).

## Validation & errors

- All request bodies are DTO classes validated by `class-validator` decorators; the global `ValidationPipe({ whitelist: true, transform: true })` strips unknown fields. See [backend/DTOS_VALIDATION.md](backend/DTOS_VALIDATION.md).
- Throw NestJS built-in exceptions (`NotFoundException`, `ConflictException`) — never return ad-hoc error objects. See [backend/ERROR_HANDLING.md](backend/ERROR_HANDLING.md).
- On the frontend, all fetch errors funnel through `handleResponse` in the API client and surface to the user via `sonner` toasts. See [frontend/API_CLIENT.md](frontend/API_CLIENT.md).

## Styling (frontend)

- Tailwind CSS v4, configured CSS-first in `src/index.css` (no `tailwind.config.js`).
- Use semantic theme tokens (`bg-background`, `text-foreground`, `text-muted-foreground`) — not raw palette colors — so light/dark themes work.
- Compose conditional classes with the `cn()` helper (`clsx` + `tailwind-merge`) from `@/lib/utils`.
- Dark mode is **class-based** (`.dark` on `<html>`, toggled by the `useDarkMode` hook). See [frontend/STYLING.md](frontend/STYLING.md).

## Git conventions (team process)

These are process conventions (not enforced by tooling in this repo):

- **Branches:** `feature/<desc>`, `fix/<desc>`, `chore/<desc>`.
- **Commits:** imperative mood, concise — "Add note color picker", not "Added...".
- **PRs:** one feature/fix per PR with a what-and-why description. Pre-PR checklist: [guides/SUBMITTING_PR.md](guides/SUBMITTING_PR.md).

## Keeping docs accurate

When you change code, update the doc that describes it. The routing table and the "Keeping Docs in Sync" section in the root [CLAUDE.md](../CLAUDE.md) map each kind of change to the doc(s) to update.
