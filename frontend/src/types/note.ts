export type NoteColor = 'default' | 'red' | 'orange' | 'yellow' | 'green' | 'blue' | 'purple' | 'pink';

export interface Note {
  id: string;
  title: string;
  body: string;
  color: NoteColor;
  position: number;
  updatedAt: string;
  createdAt: string;
}

export interface CreateNoteDto {
  title: string;
  body?: string;
  color?: NoteColor;
}

export interface UpdateNoteDto {
  title?: string;
  body?: string;
  color?: NoteColor;
  position?: number;
  expectedUpdatedAt: string;
}

export interface ConflictError {
  message: string;
  currentNote: Note;
}

export const NOTE_COLORS: { value: NoteColor; label: string; bg: string; bgDark: string }[] = [
  { value: 'default', label: 'Default', bg: 'bg-card', bgDark: 'dark:bg-card' },
  { value: 'red', label: 'Red', bg: 'bg-red-100', bgDark: 'dark:bg-red-950' },
  { value: 'orange', label: 'Orange', bg: 'bg-orange-100', bgDark: 'dark:bg-orange-950' },
  { value: 'yellow', label: 'Yellow', bg: 'bg-yellow-100', bgDark: 'dark:bg-yellow-950' },
  { value: 'green', label: 'Green', bg: 'bg-green-100', bgDark: 'dark:bg-green-950' },
  { value: 'blue', label: 'Blue', bg: 'bg-blue-100', bgDark: 'dark:bg-blue-950' },
  { value: 'purple', label: 'Purple', bg: 'bg-purple-100', bgDark: 'dark:bg-purple-950' },
  { value: 'pink', label: 'Pink', bg: 'bg-pink-100', bgDark: 'dark:bg-pink-950' },
];

export function getNoteColorClasses(color: NoteColor): string {
  const colorConfig = NOTE_COLORS.find((c) => c.value === color);
  return colorConfig ? `${colorConfig.bg} ${colorConfig.bgDark}` : 'bg-card';
}
