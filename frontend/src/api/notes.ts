import type { Note, CreateNoteDto, UpdateNoteDto, ConflictError } from '@/types/note';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export class ConflictException extends Error {
  currentNote: Note;

  constructor(data: ConflictError) {
    super(data.message);
    this.name = 'ConflictException';
    this.currentNote = data.currentNote;
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (response.status === 409) {
    const data = await response.json();
    throw new ConflictException(data);
  }

  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'An error occurred' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

export async function fetchNotes(): Promise<Note[]> {
  const response = await fetch(`${API_BASE}/notes`);
  return handleResponse<Note[]>(response);
}

export async function fetchNote(id: string): Promise<Note> {
  const response = await fetch(`${API_BASE}/notes/${id}`);
  return handleResponse<Note>(response);
}

export async function createNote(data: CreateNoteDto): Promise<Note> {
  const response = await fetch(`${API_BASE}/notes`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Note>(response);
}

export async function updateNote(id: string, data: UpdateNoteDto): Promise<Note> {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Note>(response);
}

export async function reorderNotes(noteIds: string[]): Promise<Note[]> {
  const response = await fetch(`${API_BASE}/notes/reorder`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ noteIds }),
  });
  return handleResponse<Note[]>(response);
}

export async function deleteNote(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/notes/${id}`, {
    method: 'DELETE',
  });
  return handleResponse<void>(response);
}
