import { useEffect, useState, useCallback, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import {
  ArrowLeft,
  Trash2,
  Save,
  Loader2,
  Check,
  Eye,
  EyeOff,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

import { fetchNote, updateNote, deleteNote, ConflictException } from '@/api/notes';
import type { Note, NoteColor } from '@/types/note';
import { getNoteColorClasses } from '@/types/note';
import { useDebounce } from '@/hooks/use-debounce';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { ThemeToggle } from '@/components/ThemeToggle';
import { ColorPicker } from '@/components/ColorPicker';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { cn } from '@/lib/utils';

type SaveStatus = 'saved' | 'saving' | 'unsaved' | 'error';

interface ConflictState {
  serverNote: Note;
  localTitle: string;
  localBody: string;
  localColor: NoteColor;
}

export function NoteEdit() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [note, setNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [color, setColor] = useState<NoteColor>('default');
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('saved');
  const [error, setError] = useState<string | null>(null);
  const [conflict, setConflict] = useState<ConflictState | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const titleRef = useRef<HTMLInputElement>(null);
  const lastSavedRef = useRef({ title: '', body: '', color: 'default' as NoteColor });

  // Debounced values for auto-save
  const debouncedTitle = useDebounce(title, 1000);
  const debouncedBody = useDebounce(body, 1000);
  const debouncedColor = useDebounce(color, 500);

  const loadNote = useCallback(async () => {
    if (!id) return;
    try {
      setLoading(true);
      setError(null);
      const data = await fetchNote(id);
      setNote(data);
      setTitle(data.title);
      setBody(data.body);
      setColor(data.color);
      lastSavedRef.current = { title: data.title, body: data.body, color: data.color };
      setSaveStatus('saved');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load note';
      setError(message);
      toast.error(message);
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadNote();
  }, [loadNote]);

  // Focus title on load
  useEffect(() => {
    if (!loading && titleRef.current) {
      titleRef.current.focus();
    }
  }, [loading]);

  // Track unsaved changes
  useEffect(() => {
    if (!note) return;
    const hasChanges =
      title !== lastSavedRef.current.title ||
      body !== lastSavedRef.current.body ||
      color !== lastSavedRef.current.color;
    if (hasChanges && saveStatus === 'saved') {
      setSaveStatus('unsaved');
    }
  }, [title, body, color, note, saveStatus]);

  // Auto-save effect
  useEffect(() => {
    if (!id || !note || saveStatus === 'saved' || saveStatus === 'saving') return;

    const hasChanges =
      debouncedTitle !== lastSavedRef.current.title ||
      debouncedBody !== lastSavedRef.current.body ||
      debouncedColor !== lastSavedRef.current.color;

    if (hasChanges) {
      handleSave();
    }
  }, [debouncedTitle, debouncedBody, debouncedColor]);

  // Keyboard shortcut: Ctrl+S to save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [note, title, body, color]);

  async function handleSave() {
    if (!id || !note) return;

    try {
      setSaveStatus('saving');
      const updatedNote = await updateNote(id, {
        title,
        body,
        color,
        expectedUpdatedAt: note.updatedAt,
      });
      setNote(updatedNote);
      lastSavedRef.current = { title, body, color };
      setSaveStatus('saved');
    } catch (err) {
      if (err instanceof ConflictException) {
        setConflict({
          serverNote: err.currentNote,
          localTitle: title,
          localBody: body,
          localColor: color,
        });
        setSaveStatus('error');
      } else {
        const message = err instanceof Error ? err.message : 'Failed to save note';
        toast.error(message);
        setSaveStatus('error');
      }
    }
  }

  async function handleDelete() {
    if (!id) return;
    setDeleting(true);
    try {
      await deleteNote(id);
      toast.success('Note deleted');
      navigate('/');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete note';
      toast.error(message);
      setDeleting(false);
    }
  }

  function handleKeepMyChanges() {
    if (!conflict) return;
    setNote(conflict.serverNote);
    setConflict(null);
    setSaveStatus('unsaved');
    // Will auto-save with new expectedUpdatedAt
  }

  function handleUseServerVersion() {
    if (!conflict) return;
    setNote(conflict.serverNote);
    setTitle(conflict.serverNote.title);
    setBody(conflict.serverNote.body);
    setColor(conflict.serverNote.color);
    lastSavedRef.current = {
      title: conflict.serverNote.title,
      body: conflict.serverNote.body,
      color: conflict.serverNote.color,
    };
    setSaveStatus('saved');
    setConflict(null);
    toast.info('Loaded server version');
  }

  // Word and character count
  const charCount = body.length;
  const wordCount = body.trim() ? body.trim().split(/\s+/).length : 0;

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <Skeleton className="h-10 w-32" />
            <div className="flex gap-2">
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-10" />
              <Skeleton className="h-10 w-20" />
            </div>
          </div>
          <Skeleton className="h-12 w-full mb-4" />
          <Skeleton className="h-[400px] w-full" />
        </div>
      </div>
    );
  }

  if (error && !note) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <AlertTriangle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <p className="text-destructive text-lg mb-4">{error}</p>
          <div className="flex gap-2 justify-center">
            <Button onClick={loadNote}>Retry</Button>
            <Button variant="outline" asChild>
              <Link to="/">Back to Notes</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className={cn('min-h-screen bg-background transition-colors', getNoteColorClasses(color))}>
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        >
          <Button variant="ghost" asChild className="gap-2">
            <Link to="/">
              <ArrowLeft className="h-4 w-4" />
              Back to Notes
            </Link>
          </Button>

          <div className="flex items-center gap-2">
            {/* Save status indicator */}
            <AnimatePresence mode="wait">
              <motion.div
                key={saveStatus}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium',
                  saveStatus === 'saved' && 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300',
                  saveStatus === 'saving' && 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300',
                  saveStatus === 'unsaved' && 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900 dark:text-yellow-300',
                  saveStatus === 'error' && 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300'
                )}
              >
                {saveStatus === 'saved' && <Check className="h-3 w-3" />}
                {saveStatus === 'saving' && <Loader2 className="h-3 w-3 animate-spin" />}
                {saveStatus === 'unsaved' && <span className="h-2 w-2 rounded-full bg-yellow-500" />}
                {saveStatus === 'error' && <AlertTriangle className="h-3 w-3" />}
                {saveStatus === 'saved' && 'Saved'}
                {saveStatus === 'saving' && 'Saving...'}
                {saveStatus === 'unsaved' && 'Unsaved'}
                {saveStatus === 'error' && 'Error'}
              </motion.div>
            </AnimatePresence>

            <ColorPicker value={color} onChange={setColor} />

            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowPreview(!showPreview)}
              title={showPreview ? 'Hide preview' : 'Show preview'}
            >
              {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>

            <ThemeToggle />

            <Button
              variant="outline"
              size="icon"
              onClick={handleSave}
              disabled={saveStatus === 'saved' || saveStatus === 'saving'}
              title="Save (Ctrl+S)"
            >
              <Save className="h-4 w-4" />
            </Button>

            <Button
              variant="destructive"
              size="icon"
              onClick={handleDelete}
              disabled={deleting}
              title="Delete note"
            >
              {deleting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Trash2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Editor */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <Input
            ref={titleRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Note title"
            className="text-2xl font-bold h-auto py-3 bg-transparent border-none shadow-none focus-visible:ring-0 px-0"
          />

          <div className="grid gap-4" style={{ gridTemplateColumns: showPreview ? '1fr 1fr' : '1fr' }}>
            <Textarea
              value={body}
              onChange={(e) => setBody(e.target.value)}
              placeholder="Start writing... (Supports Markdown)"
              className="min-h-[400px] resize-none bg-background/50"
            />

            <AnimatePresence>
              {showPreview && (
                <motion.div
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 20 }}
                  className="border rounded-md p-4 bg-background/50 min-h-[400px] overflow-auto prose prose-sm dark:prose-invert max-w-none"
                >
                  {body ? (
                    <ReactMarkdown>{body}</ReactMarkdown>
                  ) : (
                    <p className="text-muted-foreground italic">Preview will appear here...</p>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </motion.div>

        {/* Footer stats */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex flex-wrap items-center justify-between gap-4 mt-4 text-xs text-muted-foreground"
        >
          <div className="flex items-center gap-4">
            <span>{charCount} characters</span>
            <span>{wordCount} words</span>
          </div>
          <div>
            Last updated:{' '}
            {note ? formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true }) : 'N/A'}
          </div>
        </motion.div>

        {/* Keyboard shortcuts hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-4 text-xs text-muted-foreground text-center"
        >
          <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+S</kbd> save
        </motion.div>

        {/* Conflict Resolution Dialog */}
        <Dialog open={!!conflict} onOpenChange={() => setConflict(null)}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-yellow-500" />
                Conflict Detected
              </DialogTitle>
              <DialogDescription>
                This note has been modified by another user. Please choose how to resolve the
                conflict.
              </DialogDescription>
            </DialogHeader>

            <div className="grid grid-cols-2 gap-4 my-4">
              <div className="border rounded-lg p-4 bg-green-50 dark:bg-green-950">
                <h3 className="font-semibold mb-2 text-green-700 dark:text-green-300">
                  Your Changes
                </h3>
                <p className="font-medium text-sm">{conflict?.localTitle}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2 line-clamp-6">
                  {conflict?.localBody || '(empty)'}
                </p>
              </div>
              <div className="border rounded-lg p-4 bg-blue-50 dark:bg-blue-950">
                <h3 className="font-semibold mb-2 text-blue-700 dark:text-blue-300">
                  Server Version
                </h3>
                <p className="font-medium text-sm">{conflict?.serverNote.title}</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap mt-2 line-clamp-6">
                  {conflict?.serverNote.body || '(empty)'}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  Updated:{' '}
                  {conflict?.serverNote.updatedAt
                    ? formatDistanceToNow(new Date(conflict.serverNote.updatedAt), {
                        addSuffix: true,
                      })
                    : ''}
                </p>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={handleUseServerVersion}>
                Use Server Version
              </Button>
              <Button onClick={handleKeepMyChanges}>Keep My Changes & Retry</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
