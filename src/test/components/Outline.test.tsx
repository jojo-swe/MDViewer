import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Outline from '../../components/Outline';

describe('Outline', () => {
  it('shows an empty state when the document has no headings', () => {
    render(<Outline headings={[]} activeId={null} onHeadingClick={vi.fn()} />);
    expect(screen.getByText('No headings found')).toBeDefined();
  });

  it('renders heading depth and reports the selected heading', () => {
    const onHeadingClick = vi.fn();
    const headings = [
      { id: 'intro', text: 'Introduction', level: 1, line: 1 },
      { id: 'details', text: 'Details', level: 3, line: 8 },
    ];
    render(<Outline headings={headings} activeId="details" onHeadingClick={onHeadingClick} />);

    expect(screen.getByText('#')).toBeDefined();
    expect(screen.getByText('###')).toBeDefined();
    const details = screen.getByRole('button', { name: /Details/ });
    expect(details).toHaveClass('outline-item--active');
    expect(details).toHaveStyle({ paddingLeft: '44px' });

    fireEvent.click(details);
    expect(onHeadingClick).toHaveBeenCalledWith(headings[1]);
  });
});
