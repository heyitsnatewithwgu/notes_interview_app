# Styling

Tailwind CSS **v4**, configured CSS-first — there is **no `tailwind.config.js`**. All theme setup lives in [frontend/src/index.css](../../frontend/src/index.css). Dark mode is class-based. Animations use Framer Motion.

## Entry & plugins — `index.css`

```css
@import "tailwindcss";
@import "tw-animate-css";
@plugin "@tailwindcss/typography";

@custom-variant dark (&:is(.dark *));
```

- `@import "tailwindcss"` — the v4 single-import entry (replaces the old `@tailwind base/components/utilities`).
- `tw-animate-css` — animation utility classes.
- `@plugin "@tailwindcss/typography"` — the `prose` classes (used in the markdown preview in `NoteEdit`).
- `@custom-variant dark (&:is(.dark *))` — makes the `dark:` variant apply when any ancestor has the `.dark` class. This is what ties Tailwind to `useDarkMode`.

## Design tokens

Colors are CSS custom properties in **oklch**, mapped into Tailwind via `@theme inline`, and defined for light (`:root`) and dark (`.dark`):

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-muted-foreground: var(--muted-foreground);
  /* …card, popover, secondary, accent, destructive, border, input, ring, chart-*, sidebar-* */
  --radius-lg: var(--radius);
}

:root {
  --radius: 0.625rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.145 0 0);
  --primary: oklch(0.205 0 0);
  /* … */
}

.dark {
  --background: oklch(0.145 0 0);
  --foreground: oklch(0.985 0 0);
  --primary: oklch(0.922 0 0);
  /* … */
}
```

The `@theme inline` mapping is what turns a token into a utility: `--color-background` → `bg-background`, `text-background`, `border-background`, etc.

## Use semantic tokens, not raw palette

Style with the semantic classes so light/dark both work automatically:

`bg-background` · `text-foreground` · `text-muted-foreground` · `bg-card` · `bg-primary` / `text-primary-foreground` · `bg-muted` · `border-border` · `text-destructive` · `ring-ring`

Avoid hard-coded palette colors (`bg-white`, `text-gray-900`) for anything themed. Raw palette colors are acceptable only for the deliberately fixed note-color swatches (see below).

## Dark mode

Class-based, driven by `useDarkMode` ([HOOKS.md](HOOKS.md)), which toggles `.dark` on `<html>` and persists to `localStorage`. To make an element differ in dark mode, add `dark:` utilities:

```tsx
className="bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
```

(See the save-status pill in `NoteEdit`.) Because semantic tokens already redefine themselves under `.dark`, most components need **no** `dark:` classes at all.

## `cn()` — conditional classes

Merge/condition classes with `cn()` (`clsx` + `tailwind-merge`) from [`@/lib/utils`](../../frontend/src/lib/utils.ts):

```typescript
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
```

```tsx
className={cn('rounded-md border', isDragging && 'shadow-2xl rotate-2', getNoteColorClasses(note.color))}
```

`tailwind-merge` resolves conflicting utilities so the last one wins (e.g. two `p-*` classes won't both apply).

## Note colors

The 8 note colors are **not** theme tokens — they're a fixed table in [types/note.ts](../../frontend/src/types/note.ts) with light + dark Tailwind classes, resolved by a helper:

```typescript
export const NOTE_COLORS = [
  { value: 'default', label: 'Default', bg: 'bg-card',      bgDark: 'dark:bg-card' },
  { value: 'red',     label: 'Red',     bg: 'bg-red-100',   bgDark: 'dark:bg-red-950' },
  /* …orange, yellow, green, blue, purple, pink */
];

export function getNoteColorClasses(color: NoteColor): string {
  const c = NOTE_COLORS.find((x) => x.value === color);
  return c ? `${c.bg} ${c.bgDark}` : 'bg-card';
}
```

Use `getNoteColorClasses(note.color)` (with `cn()`) to color a card/editor. To add a color: extend the `NoteColor` union (frontend **and** backend), add a row here, and add the `@IsIn` value in the backend DTO — see [DATA_MODEL.md](../DATA_MODEL.md) and [backend/DTOS_VALIDATION.md](../backend/DTOS_VALIDATION.md).

## Animations (Framer Motion)

Standard across the app: `motion.*` elements with `initial`/`animate`/`transition`, `AnimatePresence` for mount/unmount, and gesture props (`whileHover`, `whileTap`).

```tsx
<motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>…</motion.div>
```

Keep motion subtle and consistent with existing entrances (fade + small translate/scale). See `EmptyState`, `NoteCard`, `ThemeToggle`, `ColorPicker` for the house style.

## Rules

1. Tailwind utilities only — no inline `style` for layout/color (the small exceptions in `ColorPicker`/`NoteEdit` set a dynamic swatch color / grid template, which utilities can't express).
2. Semantic tokens for themed surfaces; `dark:` only where a token doesn't cover it.
3. `cn()` for every conditional/merged class list.
4. Configure theme in `index.css` (`@theme`, tokens) — **do not** add a `tailwind.config.js`.
5. `lucide-react` for icons; Framer Motion for animation.
