# Components

Two tiers of components:

- **`components/ui/`** — shadcn/ui primitives (new-york style). Generated, low-level, reusable. Treat as a managed library.
- **`components/`** — feature components composed from primitives, specific to notes.

## shadcn/ui primitives (`components/ui/`)

Installed via the shadcn CLI and configured by [components.json](../../frontend/components.json) (`style: new-york`, `baseColor: neutral`, `iconLibrary: lucide`, `cssVariables: true`). Present today:

`button` · `card` · `dialog` · `input` · `textarea` · `popover` · `switch` · `skeleton` · `alert` · `sonner`

### Patterns these primitives use

- **`cva` variants + `data-slot`.** Example — `button.tsx`:
  ```tsx
  const buttonVariants = cva("inline-flex items-center …", {
    variants: {
      variant: { default: "…", destructive: "…", outline: "…", secondary: "…", ghost: "…", link: "…" },
      size:    { default: "…", xs: "…", sm: "…", lg: "…", icon: "…", "icon-xs": "…", "icon-sm": "…", "icon-lg": "…" },
    },
    defaultVariants: { variant: "default", size: "default" },
  });

  function Button({ className, variant, size, asChild, ...props }) {
    const Comp = asChild ? Slot : "button";
    return <Comp data-slot="button" className={cn(buttonVariants({ variant, size, className }))} {...props} />;
  }
  ```
- **`asChild` + Radix `Slot`** lets a primitive render as its child (e.g. `<Button asChild><Link/></Button>` to make a link look like a button — used in `NoteEdit`).
- Radix-backed primitives (`dialog`, `popover`, `switch`) wrap `@radix-ui/*` for accessibility.

### Rules for `ui/`

- **Do not hand-edit** these to change behavior; prefer adding a new one with `npx shadcn@latest add <name>` (this needs a new file, which is fine, but don't add npm deps beyond what the CLI pulls without asking).
- Consume them from feature components; pass `className` to extend styling (it's merged via `cn()`).
- Use the existing `variant`/`size` props rather than overriding with ad-hoc classes where a variant exists.

## Feature components (`components/`)

| Component | Purpose | Notable patterns |
|-----------|---------|------------------|
| [`NoteCard`](../../frontend/src/components/NoteCard.tsx) | A note in the list | `useSortable` (dnd-kit) + `motion.div`; whole card is a `<Link>`; drag handle is an overlay that calls `e.preventDefault()` so dragging doesn't navigate; color via `getNoteColorClasses`. |
| [`ColorPicker`](../../frontend/src/components/ColorPicker.tsx) | Pick a note color | `Popover` + a grid of `motion.button` swatches over `NOTE_COLORS`. Controlled: `{ value, onChange }`. |
| [`ThemeToggle`](../../frontend/src/components/ThemeToggle.tsx) | Light/dark switch | `useDarkMode()` + animated Sun/Moon; `sr-only` label. |
| [`EmptyState`](../../frontend/src/components/EmptyState.tsx) | Empty-list CTA | Pure presentational; `{ onCreateNote }`. |
| [`NoteSkeleton`](../../frontend/src/components/NoteSkeleton.tsx) | Loading placeholders | Exports `NoteSkeleton` and `NoteSkeletonList({ count })`. |

### Conventions for feature components

1. **Named function export**, PascalCase, one component per file: `export function NoteCard(...) {}`.
2. **Typed props interface** named `<Component>Props`:
   ```tsx
   interface NoteCardProps { note: Note; index: number; }
   export function NoteCard({ note, index }: NoteCardProps) { … }
   ```
3. **Controlled components** take `value` + `onChange` (see `ColorPicker`). Lift state to the page.
4. **Compose from `ui/` primitives** (`Card`, `Button`, `Popover`, …) rather than raw HTML where a primitive exists.
5. **`cn()` for conditional classes**, semantic theme tokens for color (so dark mode works) — see [STYLING.md](STYLING.md).
6. **Icons from `lucide-react`** only.
7. **Animate with `framer-motion`** (`motion.*`, `AnimatePresence`) — consistent with the rest of the app. Entrance animations use `initial`/`animate`; lists that add/remove use `AnimatePresence`.
8. **Accessibility:** icon-only buttons get a `title` and/or an `sr-only` label (see `ThemeToggle`, the icon buttons in `NoteEdit`).

## Adding a component

Step-by-step (feature component vs. adding a shadcn primitive): [guides/ADD_COMPONENT.md](../guides/ADD_COMPONENT.md). When you add a reusable primitive, note it in the `ui/` list above.
