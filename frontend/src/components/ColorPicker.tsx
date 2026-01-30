import { Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { NOTE_COLORS, type NoteColor } from '@/types/note';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';

interface ColorPickerProps {
  value: NoteColor;
  onChange: (color: NoteColor) => void;
}

export function ColorPicker({ value, onChange }: ColorPickerProps) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" size="icon" className="relative">
          <Palette className="h-4 w-4" />
          <span
            className={cn(
              'absolute bottom-1 right-1 h-2 w-2 rounded-full border border-white',
              value === 'default' ? 'bg-gray-400' : `bg-${value}-500`
            )}
            style={{
              backgroundColor:
                value === 'default'
                  ? '#9ca3af'
                  : value === 'red'
                  ? '#ef4444'
                  : value === 'orange'
                  ? '#f97316'
                  : value === 'yellow'
                  ? '#eab308'
                  : value === 'green'
                  ? '#22c55e'
                  : value === 'blue'
                  ? '#3b82f6'
                  : value === 'purple'
                  ? '#a855f7'
                  : '#ec4899',
            }}
          />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-2" align="end">
        <div className="grid grid-cols-4 gap-2">
          {NOTE_COLORS.map((color) => (
            <motion.button
              key={color.value}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onChange(color.value)}
              className={cn(
                'h-8 w-8 rounded-full border-2 transition-all',
                value === color.value ? 'border-primary ring-2 ring-primary/50' : 'border-transparent',
                color.value === 'default'
                  ? 'bg-gray-200 dark:bg-gray-700'
                  : color.value === 'red'
                  ? 'bg-red-400'
                  : color.value === 'orange'
                  ? 'bg-orange-400'
                  : color.value === 'yellow'
                  ? 'bg-yellow-400'
                  : color.value === 'green'
                  ? 'bg-green-400'
                  : color.value === 'blue'
                  ? 'bg-blue-400'
                  : color.value === 'purple'
                  ? 'bg-purple-400'
                  : 'bg-pink-400'
              )}
              title={color.label}
            />
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
}
