import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { GripVertical } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Card, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { getNoteColorClasses, type Note } from '@/types/note';
import { cn } from '@/lib/utils';

interface NoteCardProps {
  note: Note;
  index: number;
}

export function NoteCard({ note, index }: NoteCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <motion.div
      ref={setNodeRef}
      style={style}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      className={cn(isDragging && 'z-50')}
    >
      <Link to={`/notes/${note.id}`}>
        <Card
          className={cn(
            'group relative overflow-hidden transition-all duration-200',
            'hover:shadow-lg hover:-translate-y-1',
            isDragging && 'shadow-2xl rotate-2 scale-105',
            getNoteColorClasses(note.color)
          )}
        >
          <div
            {...attributes}
            {...listeners}
            className="absolute left-0 top-0 bottom-0 w-8 flex items-center justify-center cursor-grab active:cursor-grabbing opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={(e) => e.preventDefault()}
          >
            <GripVertical className="h-4 w-4 text-muted-foreground" />
          </div>

          <CardHeader className="pl-10">
            <CardTitle className="line-clamp-1">{note.title || 'Untitled'}</CardTitle>
            <CardDescription className="line-clamp-2">
              {note.body || 'No content'}
            </CardDescription>
            <CardDescription className="text-xs flex items-center gap-1 mt-2">
              <span className="inline-block w-2 h-2 rounded-full bg-muted-foreground/30" />
              {formatDistanceToNow(new Date(note.updatedAt), { addSuffix: true })}
            </CardDescription>
          </CardHeader>

          {/* Decorative gradient overlay on hover */}
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
        </Card>
      </Link>
    </motion.div>
  );
}
