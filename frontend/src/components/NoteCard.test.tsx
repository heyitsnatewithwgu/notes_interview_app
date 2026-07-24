import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { DndContext } from '@dnd-kit/core';
import { SortableContext } from '@dnd-kit/sortable';
import { NoteCard } from '@/components/NoteCard';
import type { Note } from '@/types/note';

const note: Note = {
  id: 'abc',
  title: 'My title',
  body: 'My body',
  color: 'blue',
  position: 0,
  createdAt: '2026-07-01T00:00:00.000Z',
  updatedAt: '2026-07-01T00:00:00.000Z',
};

function renderCard(n: Note = note) {
  return render(
    <MemoryRouter>
      <DndContext>
        <SortableContext items={[n.id]}>
          <NoteCard note={n} index={0} />
        </SortableContext>
      </DndContext>
    </MemoryRouter>,
  );
}

describe('NoteCard', () => {
  it('shows the note title and body', () => {
    renderCard();
    expect(screen.getByText('My title')).toBeInTheDocument();
    expect(screen.getByText('My body')).toBeInTheDocument();
  });

  it('links to the note editor', () => {
    renderCard();
    expect(screen.getByRole('link')).toHaveAttribute('href', '/notes/abc');
  });

  it('falls back to "Untitled" / "No content" for empty fields', () => {
    renderCard({ ...note, title: '', body: '' });
    expect(screen.getByText('Untitled')).toBeInTheDocument();
    expect(screen.getByText('No content')).toBeInTheDocument();
  });
});
