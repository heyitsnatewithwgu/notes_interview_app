import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EmptyState } from '@/components/EmptyState';

describe('EmptyState', () => {
  it('renders the empty message and CTA', () => {
    render(<EmptyState onCreateNote={() => {}} />);
    expect(screen.getByText(/no notes yet/i)).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /create your first note/i }),
    ).toBeInTheDocument();
  });

  it('invokes onCreateNote when the CTA is clicked', async () => {
    const onCreate = vi.fn();
    render(<EmptyState onCreateNote={onCreate} />);
    await userEvent.click(screen.getByRole('button', { name: /create your first note/i }));
    expect(onCreate).toHaveBeenCalledOnce();
  });
});
