# Custom Hooks

Reusable stateful logic lives in `frontend/src/hooks/` as `use-<name>.ts` files exporting a `use<Name>` function. There are two today.

## `useDebounce` — [use-debounce.ts](../../frontend/src/hooks/use-debounce.ts)

Returns a value that only updates after it has stopped changing for `delay` ms. Generic over the value type.

```typescript
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => setDebouncedValue(value), delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}
```

**Used by** `NoteEdit` to drive autosave — title/body are debounced 1000 ms, color 500 ms:

```typescript
const debouncedTitle = useDebounce(title, 1000);
const debouncedBody  = useDebounce(body, 1000);
const debouncedColor = useDebounce(color, 500);
// a separate effect watches the debounced values and calls handleSave()
```

## `useDarkMode` — [use-dark-mode.ts](../../frontend/src/hooks/use-dark-mode.ts)

Owns dark-mode state, persists it to `localStorage`, and toggles the `.dark` class on `<html>` (which is what Tailwind's dark variant keys off — see [STYLING.md](STYLING.md)).

```typescript
export function useDarkMode() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window === 'undefined') return false;
    const stored = localStorage.getItem('darkMode');
    if (stored !== null) return stored === 'true';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    const root = window.document.documentElement;
    isDark ? root.classList.add('dark') : root.classList.remove('dark');
    localStorage.setItem('darkMode', String(isDark));
  }, [isDark]);

  return { isDark, setIsDark, toggle: () => setIsDark((prev) => !prev) };
}
```

Initial value precedence: stored preference → OS `prefers-color-scheme` → light. **Used by** `ThemeToggle`.

> This is the app's actual theming mechanism. `next-themes` is in `package.json` and `ui/sonner.tsx` imports `useTheme()` from it, but there is **no `ThemeProvider`** mounted — so `next-themes` is effectively inert and `useTheme()` returns its default. Do theming through `useDarkMode`, not `next-themes`, unless you deliberately wire up a provider (and then update this doc + [STYLING.md](STYLING.md)).

## Conventions for new hooks

1. **File** `use-<name>.ts`, **export** `use<Name>` (see [CONVENTIONS.md](../CONVENTIONS.md#frontend-react)).
2. Follow the Rules of Hooks — call unconditionally at the top level.
3. **Correct dependency arrays** on `useEffect`/`useCallback`; **clean up** timers/listeners in the returned function (as `useDebounce` does).
4. Return either a single value (`useDebounce`) or a small object of state + actions (`useDarkMode`).
5. Make them generic/parameterized where it costs nothing (`useDebounce<T>`).
6. Keep side effects (network, storage, DOM) inside the hook so components stay declarative.

## Adding a hook

Step-by-step: [guides/ADD_HOOK.md](../guides/ADD_HOOK.md). Add new hooks to the list above when created.
