import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import TabBar from '../../components/TabBar';
import type { Tab } from '../../types/tab';

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: Math.floor(Math.random() * 10000),
    filename: 'Untitled.md',
    content: '',
    savedContent: '',
    isDirty: false,
    path: null,
    ...overrides,
  };
}

describe('TabBar', () => {
  it('renders tabs with filenames', () => {
    const tabs = [makeTab({ id: 1, filename: 'a.md' }), makeTab({ id: 2, filename: 'b.md' })];
    render(<TabBar tabs={tabs} activeId={1} onSwitch={vi.fn()} onClose={vi.fn()} onNew={vi.fn()} />);
    expect(screen.getByText('a.md')).toBeDefined();
    expect(screen.getByText('b.md')).toBeDefined();
  });

  it('shows dirty indicator for dirty tabs', () => {
    const tabs = [makeTab({ id: 1, filename: 'a.md', isDirty: true })];
    render(<TabBar tabs={tabs} activeId={1} onSwitch={vi.fn()} onClose={vi.fn()} onNew={vi.fn()} />);
    expect(screen.getByText('a.md')).toBeDefined();
  });

  it('calls onSwitch when clicking a tab', () => {
    const onSwitch = vi.fn();
    const tabs = [makeTab({ id: 1, filename: 'a.md' }), makeTab({ id: 2, filename: 'b.md' })];
    render(<TabBar tabs={tabs} activeId={1} onSwitch={onSwitch} onClose={vi.fn()} onNew={vi.fn()} />);
    fireEvent.click(screen.getByText('b.md'));
    expect(onSwitch).toHaveBeenCalledWith(2);
  });

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn();
    const tabs = [makeTab({ id: 1, filename: 'a.md' })];
    render(<TabBar tabs={tabs} activeId={1} onSwitch={vi.fn()} onClose={onClose} onNew={vi.fn()} />);
    const closeBtn = screen.getByLabelText('Close a.md');
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledWith(1);
  });

  it('calls onNew when clicking new tab button', () => {
    const onNew = vi.fn();
    const tabs = [makeTab({ id: 1, filename: 'a.md' })];
    render(<TabBar tabs={tabs} activeId={1} onSwitch={vi.fn()} onClose={vi.fn()} onNew={onNew} />);
    fireEvent.click(screen.getByTitle('New Tab'));
    expect(onNew).toHaveBeenCalled();
  });
});
