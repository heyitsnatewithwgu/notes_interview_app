# Guide: Add a Custom Hook

Extract reusable stateful logic into `frontend/src/hooks/`. Background + existing hooks: [frontend/HOOKS.md](../frontend/HOOKS.md).

## When to add a hook

- Logic uses React state/effects **and** is (or will be) used in more than one place, or
- It meaningfully declutters a component (timers, listeners, storage, subscriptions).

If it's pure (no state/effects), make it a plain function in `lib/` instead.

## Shape

File `use-<name>.ts`, export `use<Name>`:

```typescript
import { useEffect, useRef, useState } from 'react';

export function useInterval(callback: () => void, delayMs: number | null) {
  const saved = useRef(callback);

  useEffect(() => { saved.current = callback; }, [callback]);

  useEffect(() => {
    if (delayMs === null) return;                 // pause when null
    const id = setInterval(() => saved.current(), delayMs);
    return () => clearInterval(id);               // always clean up
  }, [delayMs]);
}
```

## Rules

1. **Naming:** file `use-<name>.ts`, function `use<Name>` ([CONVENTIONS.md](../CONVENTIONS.md)).
2. **Rules of Hooks:** call hooks unconditionally at the top level; never inside conditions/loops.
3. **Dependencies & cleanup:** exact `useEffect`/`useCallback` deps; return a cleanup for every timer/listener/subscription (both existing hooks do this).
4. **Return shape:** a single value (`useDebounce`) or a small object of state + actions (`useDarkMode` → `{ isDark, setIsDark, toggle }`).
5. **Generics** where they add flexibility for free (`useDebounce<T>`).
6. **Encapsulate side effects** (storage, DOM, network) inside the hook.
7. **SSR-safe guards** if you touch `window`/`localStorage` (`typeof window === 'undefined'`), as `useDarkMode` does — cheap and matches existing style.

## Use it

```tsx
useInterval(() => refresh(), isPaused ? null : 5000);
```

## Checklist

- [ ] `use-<name>.ts` → `use<Name>`
- [ ] Correct deps; cleanup returned
- [ ] Clear return (value or state+actions)
- [ ] Listed in [frontend/HOOKS.md](../frontend/HOOKS.md); folder `CLAUDE.md` tree updated
