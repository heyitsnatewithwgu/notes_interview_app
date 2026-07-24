# Frontend Structure

How the React SPA is laid out, boots, and routes. For folder-level rules and the tech stack, see [frontend/CLAUDE.md](../../frontend/CLAUDE.md).

## Directory layout

```
frontend/src/
├── main.tsx            # Entry: createRoot + <StrictMode>, imports index.css
├── App.tsx             # <BrowserRouter> + <Routes> + <Toaster>
├── index.css           # Tailwind v4 entry + theme tokens (see STYLING.md)
├── api/
│   └── notes.ts        # fetch-based API client + ConflictException
├── types/
│   └── note.ts         # Note types, NOTE_COLORS, getNoteColorClasses()
├── lib/
│   └── utils.ts        # cn() class-merge helper
├── hooks/
│   ├── use-dark-mode.ts
│   └── use-debounce.ts
├── pages/
│   ├── NotesList.tsx   # list, search, drag-reorder, create
│   └── NoteEdit.tsx    # editor: autosave, markdown preview, conflict dialog
├── components/
│   ├── NoteCard.tsx    # sortable note card (dnd-kit + framer-motion)
│   ├── ColorPicker.tsx # popover color palette
│   ├── ThemeToggle.tsx # light/dark toggle
│   ├── EmptyState.tsx
│   ├── NoteSkeleton.tsx
│   └── ui/             # shadcn/ui primitives (see COMPONENTS.md)
└── assets/
```

Import everything through the `@/` alias (→ `frontend/src/`). See [CONVENTIONS.md](../CONVENTIONS.md#imports).

## Entry point — `main.tsx`

```tsx
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
```

React 19, `createRoot`, wrapped in `<StrictMode>`. `index.css` is imported here so Tailwind and the theme tokens load globally.

## App shell & routing — `App.tsx`

```tsx
function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<NotesList />} />
        <Route path="/notes/:id" element={<NoteEdit />} />
      </Routes>
      <Toaster position="bottom-right" richColors />
    </BrowserRouter>
  );
}
```

- **Router:** `react-router-dom` v7, `BrowserRouter`.
- **Two routes:** `/` (list) and `/notes/:id` (editor). There is no layout wrapper, no auth guard, and **no lazy loading** — both pages are imported eagerly.
- **`<Toaster>`** (sonner) is mounted once at the app root; any component calls `toast(...)` to show notifications. See [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md).

## The two pages

| Page | File | Responsibilities |
|------|------|------------------|
| `NotesList` | [pages/NotesList.tsx](../../frontend/src/pages/NotesList.tsx) | Fetch all notes, client-side search, drag-to-reorder (dnd-kit), create (button + `Ctrl/⌘+N`), loading skeletons, error/empty states. |
| `NoteEdit` | [pages/NoteEdit.tsx](../../frontend/src/pages/NoteEdit.tsx) | Load one note, debounced **autosave**, save-status pill, markdown preview, color picker, delete, and the **conflict-resolution dialog**. `Ctrl/⌘+S` to save. |

Both are self-contained: they fetch their own data in `useEffect` and manage their own state. The reorder/autosave/conflict logic is documented in [STATE_MANAGEMENT.md](STATE_MANAGEMENT.md).

## Build config

- **Vite 7** with `@vitejs/plugin-react` and `@tailwindcss/vite`. Alias `@` → `./src` (`vite.config.ts`).
- **TypeScript** solution-style config; app code compiled per `tsconfig.app.json` (`strict`, `noUnusedLocals/Parameters`, `verbatimModuleSyntax`, alias `@/*`).
- **Scripts** ([package.json](../../frontend/package.json)): `dev` (Vite), `build` (`tsc -b && vite build`), `lint` (`eslint .`), `preview`, and `test` / `test:cov` (Vitest + coverage). See [guides/TESTING.md](../guides/TESTING.md).

## Adding to the frontend

- New page + route → [guides/ADD_PAGE.md](../guides/ADD_PAGE.md)
- New component → [guides/ADD_COMPONENT.md](../guides/ADD_COMPONENT.md)
- New hook → [guides/ADD_HOOK.md](../guides/ADD_HOOK.md)
- New API call → [API_CLIENT.md](API_CLIENT.md)
