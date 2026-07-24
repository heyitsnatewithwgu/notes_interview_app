import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { NoteEdit } from '@/pages/NoteEdit';
import * as api from '@/api/notes';
import type { Note } from '@/types/note';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

// Keep the real ConflictException class (so `instanceof` works) but mock the
// network functions.
vi.mock('@/api/notes', async (orig) => ({
  ...(await orig<typeof import('@/api/notes')>()),
  fetchNote: vi.fn(),
  updateNote: vi.fn(),
  deleteNote: vi.fn(),
}));
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

const iso = '2026-07-01T00:00:00.000Z';
const note: Note = {
  id: '1',
  title: 'Original',
  body: 'Body text',
  color: 'default',
  position: 0,
  createdAt: iso,
  updatedAt: iso,
};

const renderEdit = () =>
  render(
    <MemoryRouter initialEntries={['/notes/1']}>
      <Routes>
        <Route path="/notes/:id" element={<NoteEdit />} />
      </Routes>
    </MemoryRouter>,
  );

beforeEach(() => vi.clearAllMocks());

describe('NoteEdit', () => {
  it('loads and displays the note', async () => {
    vi.mocked(api.fetchNote).mockResolvedValue(note);
    renderEdit();
    expect(await screen.findByDisplayValue('Original')).toBeInTheDocument();
    expect(screen.getByDisplayValue('Body text')).toBeInTheDocument();
  });

  it('shows an error state when the note fails to load', async () => {
    vi.mocked(api.fetchNote).mockRejectedValue(new Error('Not found'));
    renderEdit();
    expect(await screen.findByText('Not found')).toBeInTheDocument();
  });

  it('saves edits with the last-seen updatedAt as the lock token', async () => {
    vi.mocked(api.fetchNote).mockResolvedValue(note);
    vi.mocked(api.updateNote).mockResolvedValue({ ...note, title: 'Original edited' });
    const user = userEvent.setup();
    renderEdit();

    const title = await screen.findByDisplayValue('Original');
    await user.type(title, ' edited');
    await user.click(screen.getByTitle(/save/i));

    await waitFor(() => expect(api.updateNote).toHaveBeenCalled());
    expect(vi.mocked(api.updateNote).mock.calls[0][1]).toMatchObject({ expectedUpdatedAt: iso });
  });

  it('opens the conflict dialog and can adopt the server version', async () => {
    const serverNote: Note = { ...note, title: 'Server wins', updatedAt: '2026-07-03T00:00:00.000Z' };
    vi.mocked(api.fetchNote).mockResolvedValue(note);
    vi.mocked(api.updateNote).mockRejectedValue(
      new api.ConflictException({ message: 'Note has been modified by another user', currentNote: serverNote }),
    );
    const user = userEvent.setup();
    renderEdit();

    const title = await screen.findByDisplayValue('Original');
    await user.type(title, ' x');
    await user.click(screen.getByTitle(/save/i));

    expect(await screen.findByText(/conflict detected/i)).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /use server version/i }));
    expect(await screen.findByDisplayValue('Server wins')).toBeInTheDocument();
  });

  it('deletes the note and navigates home', async () => {
    vi.mocked(api.fetchNote).mockResolvedValue(note);
    vi.mocked(api.deleteNote).mockResolvedValue(undefined);
    const user = userEvent.setup();
    renderEdit();

    await screen.findByDisplayValue('Original');
    await user.click(screen.getByTitle(/delete note/i));

    await waitFor(() => expect(api.deleteNote).toHaveBeenCalledWith('1'));
    expect(navigate).toHaveBeenCalledWith('/');
  });
});
