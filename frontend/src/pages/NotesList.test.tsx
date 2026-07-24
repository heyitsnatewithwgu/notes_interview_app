import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { NotesList } from '@/pages/NotesList';
import * as api from '@/api/notes';
import type { Note } from '@/types/note';

const { navigate } = vi.hoisted(() => ({ navigate: vi.fn() }));

vi.mock('@/api/notes');
vi.mock('sonner', () => ({ toast: { success: vi.fn(), error: vi.fn(), info: vi.fn() } }));
vi.mock('react-router-dom', async (orig) => ({
  ...(await orig<typeof import('react-router-dom')>()),
  useNavigate: () => navigate,
}));

const iso = '2026-07-01T00:00:00.000Z';
const notes: Note[] = [
  { id: '1', title: 'Groceries', body: 'Milk and eggs', color: 'default', position: 0, createdAt: iso, updatedAt: iso },
  { id: '2', title: 'Ideas', body: 'Build something', color: 'blue', position: 1, createdAt: iso, updatedAt: iso },
];

const renderList = () => render(<MemoryRouter><NotesList /></MemoryRouter>);

beforeEach(() => vi.clearAllMocks());

describe('NotesList', () => {
  it('renders notes after loading', async () => {
    vi.mocked(api.fetchNotes).mockResolvedValue(notes);
    renderList();
    expect(await screen.findByText('Groceries')).toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
  });

  it('shows the empty state when there are no notes', async () => {
    vi.mocked(api.fetchNotes).mockResolvedValue([]);
    renderList();
    expect(await screen.findByText(/no notes yet/i)).toBeInTheDocument();
  });

  it('shows an error with a retry button when loading fails', async () => {
    vi.mocked(api.fetchNotes).mockRejectedValue(new Error('Network down'));
    renderList();
    expect(await screen.findByText('Network down')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /retry/i })).toBeInTheDocument();
  });

  it('filters the list by search query', async () => {
    vi.mocked(api.fetchNotes).mockResolvedValue(notes);
    renderList();
    await screen.findByText('Groceries');

    await userEvent.type(screen.getByPlaceholderText(/search notes/i), 'idea');

    expect(screen.queryByText('Groceries')).not.toBeInTheDocument();
    expect(screen.getByText('Ideas')).toBeInTheDocument();
  });

  it('creates a note and navigates to its editor', async () => {
    vi.mocked(api.fetchNotes).mockResolvedValue([]);
    vi.mocked(api.createNote).mockResolvedValue({ ...notes[0], id: 'new-id' });
    renderList();
    await screen.findByText(/no notes yet/i);

    await userEvent.click(screen.getByRole('button', { name: /create your first note/i }));

    await waitFor(() => expect(api.createNote).toHaveBeenCalled());
    expect(navigate).toHaveBeenCalledWith('/notes/new-id');
  });
});
