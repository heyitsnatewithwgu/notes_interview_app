import { render, screen } from '@testing-library/react';
import App from '@/App';
import * as api from '@/api/notes';

vi.mock('@/api/notes');

describe('App', () => {
  it('renders the notes list route at "/"', async () => {
    vi.mocked(api.fetchNotes).mockResolvedValue([]);
    render(<App />);
    // NotesList heading renders even while empty.
    expect(await screen.findByRole('heading', { name: /my notes/i })).toBeInTheDocument();
  });
});
