import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ColorPicker } from '@/components/ColorPicker';

describe('ColorPicker', () => {
  it('renders a trigger button', () => {
    render(<ColorPicker value="default" onChange={() => {}} />);
    expect(screen.getByRole('button')).toBeInTheDocument();
  });

  it('opens the palette and reports the chosen color', async () => {
    const onChange = vi.fn();
    const user = userEvent.setup();
    render(<ColorPicker value="default" onChange={onChange} />);

    await user.click(screen.getByRole('button')); // open the popover
    const red = await screen.findByTitle('Red');
    await user.click(red);

    expect(onChange).toHaveBeenCalledWith('red');
  });
});
