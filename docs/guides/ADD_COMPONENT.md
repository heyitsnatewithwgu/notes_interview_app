# Guide: Add a Component

Two cases: a **shadcn/ui primitive** (`components/ui/`) or a **feature component** (`components/`). Background: [COMPONENTS.md](../frontend/COMPONENTS.md).

## Case A — add a shadcn/ui primitive

Use the CLI so it matches the configured style (`new-york`, `neutral`, CSS variables — [components.json](../../frontend/components.json)):

```bash
cd frontend
npx shadcn@latest add tooltip     # e.g. tooltip, dropdown-menu, select, tabs …
```

This writes `components/ui/tooltip.tsx` and may pull in a Radix package. That's expected for shadcn primitives — but if it wants to add anything beyond the primitive's own Radix dep, pause and confirm (see the no-new-deps rule in the root [CLAUDE.md](../../CLAUDE.md)). After adding, list it in the `ui/` inventory in [COMPONENTS.md](../frontend/COMPONENTS.md). Don't hand-edit generated primitives to change behavior.

## Case B — add a feature component

`frontend/src/components/<Name>.tsx`, named export, typed props:

```tsx
import { motion } from 'framer-motion';
import { Card, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import type { Note } from '@/types/note';

interface ThingBadgeProps {
  note: Note;
  onSelect?: (id: string) => void;
  className?: string;
}

export function ThingBadge({ note, onSelect, className }: ThingBadgeProps) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
      <Card className={cn('cursor-pointer hover:shadow-lg', className)} onClick={() => onSelect?.(note.id)}>
        <CardHeader>
          <CardTitle className="line-clamp-1">{note.title || 'Untitled'}</CardTitle>
        </CardHeader>
      </Card>
    </motion.div>
  );
}
```

### Rules (from [COMPONENTS.md](../frontend/COMPONENTS.md))

1. Named function export, PascalCase, one per file; props interface `<Component>Props`.
2. **Controlled** where it holds selectable/editable state: take `value` + `onChange` and lift state to the parent.
3. Accept an optional `className` and merge with `cn()` so callers can extend styling.
4. Compose from `ui/` primitives (`Card`, `Button`, `Popover`, …) over raw HTML.
5. Semantic theme tokens (so dark mode works); `dark:` only where a token doesn't cover it.
6. Icons from `lucide-react`; animate with `framer-motion`.
7. **Accessibility:** icon-only buttons need a `title` and/or `sr-only` label; keyboard operable.

## Checklist

- [ ] Right location (`ui/` = generated primitive, `components/` = feature)
- [ ] Named export, PascalCase, `<Component>Props` interface
- [ ] Composes `ui/` primitives; `className` merged via `cn()`
- [ ] Semantic tokens; lucide icons; framer-motion
- [ ] Accessible (labels, keyboard)
- [ ] New primitive listed in [COMPONENTS.md](../frontend/COMPONENTS.md); folder `CLAUDE.md` tree updated
