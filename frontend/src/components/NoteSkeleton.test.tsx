import { render } from '@testing-library/react';
import { NoteSkeleton, NoteSkeletonList } from '@/components/NoteSkeleton';

describe('NoteSkeleton', () => {
  it('renders a single skeleton card', () => {
    const { container } = render(<NoteSkeleton />);
    expect(container.querySelector('[data-slot="card"]')).toBeInTheDocument();
  });

  it('renders one card per requested count', () => {
    const { container } = render(<NoteSkeletonList count={3} />);
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(3);
  });

  it('defaults to 3 cards when no count is given', () => {
    const { container } = render(<NoteSkeletonList />);
    expect(container.querySelectorAll('[data-slot="card"]')).toHaveLength(3);
  });
});
