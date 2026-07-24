# Guide: Add a Page

Add a routed page to the SPA. Background: [frontend/STRUCTURE.md](../frontend/STRUCTURE.md), [STATE_MANAGEMENT.md](../frontend/STATE_MANAGEMENT.md).

## 1. Create the page component

`frontend/src/pages/<Name>.tsx`, named export, following the fetch-in-`useEffect` + branch-on-state pattern:

```tsx
import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { fetchThings } from '@/api/things';
import type { Thing } from '@/types/thing';
import { Button } from '@/components/ui/button';

export function ThingsPage() {
  const [things, setThings] = useState<Thing[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setThings(await fetchThings());
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  if (loading) return /* <Skeleton.../> */;
  if (error)   return /* error + retry button */;
  if (things.length === 0) return /* <EmptyState/> */;

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 max-w-4xl">…</div>
    </div>
  );
}
```

Match the existing page shell: `min-h-screen bg-background`, centered `container mx-auto p-6 max-w-4xl`. Handle **loading / error / empty / content** — don't skip states.

## 2. Register the route

In [App.tsx](../../frontend/src/App.tsx):

```tsx
<Routes>
  <Route path="/" element={<NotesList />} />
  <Route path="/notes/:id" element={<NoteEdit />} />
  <Route path="/things" element={<ThingsPage />} />   {/* new */}
</Routes>
```

Route paths are kebab-case; params use `:param` and are read with `useParams()`. Routing is eager (no lazy loading in this app) — keep it that way unless you're deliberately introducing code-splitting.

## 3. Navigation

- Links: `<Link to="/things">` (or `<Button asChild><Link .../></Button>`).
- Programmatic: `const navigate = useNavigate(); navigate('/things/' + id)` (see `NotesList.handleCreateNote`).

## 4. Data, notifications, shortcuts

- Fetch via the API client ([API_CLIENT.md](../frontend/API_CLIENT.md)); never `fetch` inline.
- Errors → `toast.error`. Success → `toast.success` where useful.
- Keyboard shortcuts: `window.addEventListener('keydown', …)` in a `useEffect` with cleanup + `e.preventDefault()` (see [STATE_MANAGEMENT.md](../frontend/STATE_MANAGEMENT.md#keyboard-shortcuts)).

## 5. Styling & motion

Semantic tokens + `cn()` ([STYLING.md](../frontend/STYLING.md)); entrance animations with `framer-motion` to match `NotesList`/`NoteEdit`.

## Checklist

- [ ] Page in `pages/`, named export, page shell classes
- [ ] Loading / error / empty / content states
- [ ] Route registered in `App.tsx` (kebab-case path)
- [ ] Data via API client; errors via toast
- [ ] Semantic tokens + `cn()`; icons from lucide; motion consistent
- [ ] Folder `CLAUDE.md` tree updated if you added files
