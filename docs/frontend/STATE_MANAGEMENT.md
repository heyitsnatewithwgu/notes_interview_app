# State Management & Data Fetching

The frontend uses **local component state only**. There is no global store (no Redux/Zustand), no React Context, and no data-fetching library (no React Query/SWR). Each page owns its data and its lifecycle.

## The pattern

A page:
1. holds its data + `loading` + `error` in `useState`,
2. fetches in a `useCallback` invoked from `useEffect`,
3. surfaces failures with a `sonner` toast,
4. renders skeleton / error / empty / content branches.

From [NotesList.tsx](../../frontend/src/pages/NotesList.tsx):

```typescript
const [notes, setNotes] = useState<Note[]>([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState<string | null>(null);

const loadNotes = useCallback(async () => {
  try {
    setLoading(true);
    setError(null);
    const data = await fetchNotes();
    setNotes(data);
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to load notes';
    setError(message);
    toast.error(message);
  } finally {
    setLoading(false);
  }
}, []);

useEffect(() => { loadNotes(); }, [loadNotes]);
```

Render branches (in order): `loading` → skeletons (`NoteSkeletonList` / `Skeleton`); `error` → message + retry button; empty → `<EmptyState>`; otherwise the content.

## Notifications

`<Toaster>` is mounted once in `App.tsx`. Anywhere, call `toast.success(...)` / `toast.error(...)` / `toast.info(...)`. **All user-facing error reporting is via toasts** — do not render raw errors or use `alert`.

## Optimistic UI

Two interactions update the UI immediately and reconcile with the server after:

### Drag-to-reorder (`NotesList`)
Reorder the local array first, then persist; **revert on failure**:

```typescript
setNotes(newNotes);                              // optimistic
try {
  await reorderNotes(newNotes.map((n) => n.id));
  toast.success('Notes reordered');
} catch (err) {
  setNotes(notes);                               // revert to previous
  toast.error('Failed to reorder notes');
}
```

### Autosave (`NoteEdit`)
Debounced values ([HOOKS.md](HOOKS.md)) trigger a save when they differ from the last-saved snapshot held in a `useRef`:

```typescript
const lastSavedRef = useRef({ title: '', body: '', color: 'default' as NoteColor });
// effect on [debouncedTitle, debouncedBody, debouncedColor]:
if (hasChanges) handleSave();
```

## Save-status state machine (`NoteEdit`)

Autosave is surfaced with an explicit status, rendered as an animated pill:

```typescript
type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';
```

```
loaded ──► saved
edit ─────► unsaved ──(debounce)──► saving ──► saved
                                        └────► error
```

- An effect flips `saved → unsaved` when current values diverge from `lastSavedRef`.
- `handleSave` sets `saving`, calls `updateNote`, then `saved` (updating `note` + `lastSavedRef`), or `error`.

## Conflict resolution (`NoteEdit`)

The signature flow. `handleSave` sends the last-seen `updatedAt` and branches on the typed error:

```typescript
const updatedNote = await updateNote(id, {
  title, body, color,
  expectedUpdatedAt: note.updatedAt,   // optimistic-lock token
});
// …
catch (err) {
  if (err instanceof ConflictException) {
    setConflict({ serverNote: err.currentNote, localTitle: title, localBody: body, localColor: color });
    setSaveStatus('error');
  } else {
    toast.error(message); setSaveStatus('error');
  }
}
```

`conflict` state (non-null) opens a `<Dialog>` showing **Your Changes** vs. **Server Version**, with two resolutions:

- **Keep My Changes & Retry** → adopt the server note as the new base (`setNote(serverNote)`), mark `unsaved`; autosave retries with the server's fresh `updatedAt`.
- **Use Server Version** → overwrite the editor fields with the server note and mark `saved`.

Backend side of this contract: [backend/SERVICES.md](../backend/SERVICES.md) and [backend/ERROR_HANDLING.md](../backend/ERROR_HANDLING.md).

## Search

`NotesList` fetches all notes once and filters in the browser (case-insensitive, title+body). There is no server-side search/pagination:

```typescript
const filteredNotes = notes.filter(
  (n) => n.title.toLowerCase().includes(q) || n.body.toLowerCase().includes(q),
);
```

## Keyboard shortcuts

Registered with `window.addEventListener('keydown', …)` inside `useEffect`, cleaned up on unmount: `Ctrl/⌘+N` (new note, `NotesList`), `Ctrl/⌘+S` (save, `NoteEdit`). Both call `e.preventDefault()`.

## Guidance

- Keep state **local** to the page/component that needs it. Only reach for Context/a store if genuinely shared across distant components — and discuss first, since it's a departure from the current architecture (and may add a dependency).
- Derive, don't duplicate: compute values like `filteredNotes`, `charCount` during render instead of storing them.
- Use `useRef` for values that shouldn't trigger re-renders (`lastSavedRef`, DOM refs).
- Every async action: set loading, `try/catch`, `toast` on error, reconcile state in `finally`/success.
