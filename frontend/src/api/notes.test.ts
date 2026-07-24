import {
  fetchNotes,
  fetchNote,
  createNote,
  updateNote,
  reorderNotes,
  deleteNote,
  ConflictException,
} from '@/api/notes';
import type { Note } from '@/types/note';

const note: Note = {
  id: '1',
  title: 'T',
  body: 'B',
  color: 'default',
  position: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

function okJson(data: unknown, status = 200) {
  return vi.fn().mockResolvedValue({ ok: true, status, json: async () => data });
}

afterEach(() => {
  vi.restoreAllMocks();
});

describe('api/notes', () => {
  it('fetchNotes GETs /notes and returns the list', async () => {
    global.fetch = okJson([note]);
    await expect(fetchNotes()).resolves.toEqual([note]);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/notes$/));
  });

  it('fetchNote GETs /notes/:id', async () => {
    global.fetch = okJson(note);
    await expect(fetchNote('1')).resolves.toEqual(note);
    expect(global.fetch).toHaveBeenCalledWith(expect.stringMatching(/\/notes\/1$/));
  });

  it('createNote POSTs JSON', async () => {
    global.fetch = okJson(note, 201);
    await createNote({ title: 'T' });
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/notes$/),
      expect.objectContaining({ method: 'POST' }),
    );
  });

  it('reorderNotes PATCHes /notes/reorder with the id list', async () => {
    global.fetch = okJson([note]);
    await reorderNotes(['1', '2']);
    expect(global.fetch).toHaveBeenCalledWith(
      expect.stringMatching(/\/notes\/reorder$/),
      expect.objectContaining({ method: 'PATCH', body: JSON.stringify({ noteIds: ['1', '2'] }) }),
    );
  });

  it('updateNote throws ConflictException carrying currentNote on 409', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 409,
      json: async () => ({ message: 'Note has been modified by another user', currentNote: note }),
    });

    await expect(updateNote('1', { expectedUpdatedAt: 'x' })).rejects.toBeInstanceOf(
      ConflictException,
    );
    try {
      await updateNote('1', { expectedUpdatedAt: 'x' });
    } catch (err) {
      expect((err as ConflictException).currentNote).toEqual(note);
    }
  });

  it('throws Error with the server message on other non-ok responses', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({ message: 'boom' }),
    });
    await expect(fetchNote('1')).rejects.toThrow('boom');
  });

  it('deleteNote resolves to undefined on 204 (no body parsed)', async () => {
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      status: 204,
      json: async () => {
        throw new Error('204 has no body');
      },
    });
    await expect(deleteNote('1')).resolves.toBeUndefined();
  });
});
