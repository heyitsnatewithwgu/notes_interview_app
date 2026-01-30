import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Search, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

import { fetchNotes, createNote, reorderNotes } from '@/api/notes';
import type { Note } from '@/types/note';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/ThemeToggle';
import { NoteCard } from '@/components/NoteCard';
import { NoteSkeletonList } from '@/components/NoteSkeleton';
import { EmptyState } from '@/components/EmptyState';

export function NotesList() {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

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

  useEffect(() => {
    loadNotes();
  }, [loadNotes]);

  // Keyboard shortcut: Ctrl+N to create new note
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateNote();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  async function handleCreateNote() {
    try {
      const note = await createNote({ title: 'Untitled Note', body: '' });
      toast.success('Note created!');
      navigate(`/notes/${note.id}`);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create note';
      toast.error(message);
    }
  }

  async function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      const oldIndex = notes.findIndex((n) => n.id === active.id);
      const newIndex = notes.findIndex((n) => n.id === over.id);

      const newNotes = [...notes];
      const [removed] = newNotes.splice(oldIndex, 1);
      newNotes.splice(newIndex, 0, removed);

      setNotes(newNotes);

      try {
        await reorderNotes(newNotes.map((n) => n.id));
        toast.success('Notes reordered');
      } catch (err) {
        // Revert on error
        setNotes(notes);
        toast.error('Failed to reorder notes');
      }
    }
  }

  const filteredNotes = notes.filter(
    (note) =>
      note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      note.body.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <div className="container mx-auto p-6 max-w-4xl">
          <div className="flex justify-between items-center mb-6">
            <div className="h-9 w-32 bg-muted rounded animate-pulse" />
            <div className="flex gap-2">
              <div className="h-10 w-10 bg-muted rounded animate-pulse" />
              <div className="h-10 w-28 bg-muted rounded animate-pulse" />
            </div>
          </div>
          <NoteSkeletonList count={4} />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center gap-4 p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center"
        >
          <p className="text-destructive text-lg mb-4">{error}</p>
          <Button onClick={loadNotes} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Retry
          </Button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background transition-colors">
      <div className="container mx-auto p-6 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6"
        >
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            My Notes
          </h1>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Button onClick={handleCreateNote} className="gap-2">
              <Plus className="h-4 w-4" />
              New Note
            </Button>
          </div>
        </motion.div>

        {/* Search */}
        {notes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="relative mb-6"
          >
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search notes..."
              className="pl-10"
            />
          </motion.div>
        )}

        {/* Notes List */}
        {notes.length === 0 ? (
          <EmptyState onCreateNote={handleCreateNote} />
        ) : filteredNotes.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <p className="text-muted-foreground">No notes match your search.</p>
            <Button
              variant="link"
              onClick={() => setSearchQuery('')}
              className="mt-2"
            >
              Clear search
            </Button>
          </motion.div>
        ) : (
          <DndContext
            sensors={sensors}
            collisionDetection={closestCenter}
            onDragEnd={handleDragEnd}
          >
            <SortableContext
              items={filteredNotes.map((n) => n.id)}
              strategy={verticalListSortingStrategy}
            >
              <div className="grid gap-4">
                <AnimatePresence>
                  {filteredNotes.map((note, index) => (
                    <NoteCard key={note.id} note={note} index={index} />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>
        )}

        {/* Footer info */}
        {notes.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="mt-8 text-center text-xs text-muted-foreground"
          >
            {notes.length} note{notes.length !== 1 && 's'} • Drag to reorder •{' '}
            <kbd className="px-1.5 py-0.5 bg-muted rounded">Ctrl+N</kbd> new note
          </motion.div>
        )}
      </div>
    </div>
  );
}
