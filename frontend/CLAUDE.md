# Frontend — Claude Code Instructions

React SPA for the Collaborative Notes App. Read this before working anywhere under `frontend/`. Cross-cutting context is in the root [CLAUDE.md](../CLAUDE.md); deep dives are in [docs/frontend/](../docs/frontend/).

## Tech Stack

- **Framework:** React **19** + TypeScript 5.9 (ESM)
- **Build:** Vite 7 (`@vitejs/plugin-react`, `@tailwindcss/vite`); alias `@` → `src/`
- **Routing:** React Router v7 (`react-router-dom`), `BrowserRouter`
- **Styling:** Tailwind CSS v4 (CSS-first in `src/index.css`, **no `tailwind.config.js`**) + shadcn/ui (new-york)
- **UI primitives:** Radix (`dialog`, `popover`, `switch`, `slot`) via shadcn; `cva` + `cn()`
- **Icons:** `lucide-react` (only)
- **Animation:** Framer Motion 12
- **Drag & drop:** dnd-kit (`core`, `sortable`, `utilities`)
- **Markdown:** `react-markdown` + `@tailwindcss/typography`
- **Toasts:** `sonner`
- **Dates:** `date-fns`
- **State/data:** local component state only — **no Redux/Zustand, no Context, no React Query**. `fetch`-based API client.
- **Tests:** Vitest + Testing Library — unit/component/page (`src/**/*.test.ts(x)`); ~91% coverage, gated at 70%. Full-stack E2E via Playwright in `../e2e/`. See [docs/guides/TESTING.md](../docs/guides/TESTING.md).

## Critical Rules

- **Do not add npm dependencies** without asking first (adding a shadcn primitive via `npx shadcn add` is fine; anything more, confirm).
- **All API calls go through `src/api/notes.ts`** (via `handleResponse<T>()`). Never call `fetch` from a component. See [docs/frontend/API_CLIENT.md](../docs/frontend/API_CLIENT.md).
- **Handle all four states** in data views: loading (skeleton) / error (retry) / empty (`EmptyState`) / content. See [docs/frontend/STATE_MANAGEMENT.md](../docs/frontend/STATE_MANAGEMENT.md).
- **Errors surface as `sonner` toasts** — never `alert`, never raw error text.
- **Preserve the conflict-resolution flow** in `NoteEdit` — catch `ConflictException`, open the dialog, honor the `expectedUpdatedAt` contract.
- **Styling:** Tailwind utilities + semantic theme tokens (`bg-background`, `text-foreground`, …) + `cn()`. Dark mode is the `.dark` class via `useDarkMode` — **not `next-themes`**. See [docs/frontend/STYLING.md](../docs/frontend/STYLING.md).
- **Imports** use the `@/` alias and `import type` for types (`verbatimModuleSyntax` is on). No deep relative paths.
- **Keep the frontend `Note` types in sync** with the backend entity/DTOs ([docs/DATA_MODEL.md](../docs/DATA_MODEL.md)).
- **Accessibility:** icon-only buttons get `title`/`sr-only`; keyboard-operable.
- **Ship tests with every change:** a Vitest `*.test.tsx` beside new components/pages/hooks (mock `@/api/notes`), covering loading/error/empty for data views and the conflict flow where relevant; add a Playwright spec in `../e2e/` for new user journeys. Keep coverage ≥70% (`npm run test:cov`). See [docs/guides/TESTING.md](../docs/guides/TESTING.md).
- **Update docs** when adding a `ui/` primitive ([docs/frontend/COMPONENTS.md](../docs/frontend/COMPONENTS.md)), a hook ([docs/frontend/HOOKS.md](../docs/frontend/HOOKS.md)), or files (this tree).

## Directory Structure

```
frontend/src/
├── main.tsx            # createRoot + <StrictMode>; imports index.css
├── App.tsx             # <BrowserRouter> routes: "/" -> NotesList, "/notes/:id" -> NoteEdit; <Toaster>
├── index.css           # Tailwind v4 entry + oklch theme tokens + .dark vars
├── api/
│   └── notes.ts        # fetch client + ConflictException + handleResponse<T>
├── types/
│   └── note.ts         # Note, *Dto, ConflictError, NOTE_COLORS, getNoteColorClasses()
├── lib/
│   └── utils.ts        # cn() (clsx + tailwind-merge)
├── hooks/
│   ├── use-dark-mode.ts    # .dark class + localStorage
│   └── use-debounce.ts     # generic debounce (drives autosave)
├── pages/
│   ├── NotesList.tsx   # list, client-side search, dnd reorder, create (Ctrl+N)
│   └── NoteEdit.tsx    # autosave, save-status pill, markdown preview, conflict dialog (Ctrl+S)
└── components/
    ├── NoteCard.tsx    # sortable card (dnd-kit + motion), whole card is a <Link>
    ├── ColorPicker.tsx # popover palette over NOTE_COLORS
    ├── ThemeToggle.tsx # animated light/dark toggle
    ├── EmptyState.tsx
    ├── NoteSkeleton.tsx  # NoteSkeleton + NoteSkeletonList
    └── ui/             # shadcn/ui: button, card, dialog, input, textarea, popover, switch, skeleton, alert, sonner
```

Tests are **colocated** as `*.test.ts(x)` beside each source file (hooks, api, components, pages), with shared setup in `src/test/setup.ts` and the Vitest config in the `test` block of `vite.config.ts`. Full-stack E2E lives in [../e2e/](../e2e/).

## Commands

```bash
# From the dev stack (preferred):
docker compose -f docker-compose.dev.yml up frontend    # http://localhost:5173

# Locally inside frontend/:
npm run dev              # Vite dev server
npm run build            # tsc -b && vite build
npm run lint             # ESLint
npm test                 # Vitest (unit/component/page)
npm run test:cov         # + coverage (fails under 70%)
```

## Environment Variables

`VITE_API_URL` (default `http://localhost:3000`) — API base, **inlined at build time**. Changing it needs a rebuild, not a restart. See [docs/ENV_VARS.md](../docs/ENV_VARS.md).

## Deeper Docs

- [docs/frontend/STRUCTURE.md](../docs/frontend/STRUCTURE.md) — layout, entry, routing
- [docs/frontend/COMPONENTS.md](../docs/frontend/COMPONENTS.md) — shadcn/ui + feature components
- [docs/frontend/API_CLIENT.md](../docs/frontend/API_CLIENT.md) — fetch client & ConflictException
- [docs/frontend/HOOKS.md](../docs/frontend/HOOKS.md) — useDebounce, useDarkMode
- [docs/frontend/STATE_MANAGEMENT.md](../docs/frontend/STATE_MANAGEMENT.md) — data fetching, autosave, conflict flow
- [docs/frontend/STYLING.md](../docs/frontend/STYLING.md) — Tailwind v4, tokens, dark mode, motion
- [docs/guides/TESTING.md](../docs/guides/TESTING.md) — Vitest/RTL patterns & coverage · [docs/platform/CI_CD.md](../docs/platform/CI_CD.md)
- Guides: [ADD_PAGE](../docs/guides/ADD_PAGE.md) · [ADD_COMPONENT](../docs/guides/ADD_COMPONENT.md) · [ADD_HOOK](../docs/guides/ADD_HOOK.md)
