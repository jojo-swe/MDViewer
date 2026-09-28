import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import CommandPalette from '../../components/CommandPalette';
import type { Command } from '../../types/command';

const SAMPLE_COMMANDS: Command[] = [
  { id: 'file.new', title: 'New Tab', shortcut: 'Ctrl+N', category: 'file', action: vi.fn() },
  { id: 'file.open', title: 'Open File', shortcut: 'Ctrl+O', category: 'file', action: vi.fn() },
  { id: 'view.sidebar', title: 'Toggle Sidebar', shortcut: 'Ctrl+B', category: 'view', action: vi.fn() },
  { id: 'lint.toggle', title: 'Toggle Linting', category: 'lint', action: vi.fn() },
];

describe('CommandPalette', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <CommandPalette visible={false} commands={SAMPLE_COMMANDS} onClose={vi.fn()} onExecute={vi.fn()} />
    );
    expect(container.querySelector('.cmd-palette-overlay')).toBeNull();
  });

  it('renders search input when visible', () => {
    render(<CommandPalette visible={true} commands={SAMPLE_COMMANDS} onClose={vi.fn()} onExecute={vi.fn()} />);
    expect(screen.getByPlaceholderText('Type a command...')).toBeDefined();
  });

  it('shows all commands when query is empty', () => {
    render(<CommandPalette visible={true} commands={SAMPLE_COMMANDS} onClose={vi.fn()} onExecute={vi.fn()} />);
    expect(screen.getByText('New Tab')).toBeDefined();
    expect(screen.getByText('Open File')).toBeDefined();
    expect(screen.getByText('Toggle Sidebar')).toBeDefined();
    expect(screen.getByText('Toggle Linting')).toBeDefined();
  });

  it('filters commands by search query', () => {
    render(<CommandPalette visible={true} commands={SAMPLE_COMMANDS} onClose={vi.fn()} onExecute={vi.fn()} />);
    const input = screen.getByPlaceholderText('Type a command...');
    fireEvent.change(input, { target: { value: 'sidebar' } });
    expect(screen.getByText('Toggle Sidebar')).toBeDefined();
    expect(screen.queryByText('New Tab')).toBeNull();
  });

  it('shows no results message for unmatched query', () => {
    render(<CommandPalette visible={true} commands={SAMPLE_COMMANDS} onClose={vi.fn()} onExecute={vi.fn()} />);
    fireEvent.change(screen.getByPlaceholderText('Type a command...'), { target: { value: 'xyzabc' } });
    expect(screen.getByText('No commands found')).toBeDefined();
  });

  it('calls onClose when pressing Escape', () => {
    const onClose = vi.fn();
    render(<CommandPalette visible={true} commands={SAMPLE_COMMANDS} onClose={onClose} onExecute={vi.fn()} />);
    fireEvent.keyDown(screen.getByPlaceholderText('Type a command...'), { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onExecute and onClose when clicking a command', () => {
    const onExecute = vi.fn();
    const onClose = vi.fn();
    render(<CommandPalette visible={true} commands={SAMPLE_COMMANDS} onClose={onClose} onExecute={onExecute} />);
    fireEvent.click(screen.getByText('New Tab'));
    expect(onExecute).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it('navigates with arrow keys and executes with Enter', () => {
    const onExecute = vi.fn();
    const onClose = vi.fn();
    render(<CommandPalette visible={true} commands={SAMPLE_COMMANDS} onClose={onClose} onExecute={onExecute} />);
    const input = screen.getByPlaceholderText('Type a command...');
    fireEvent.keyDown(input, { key: 'ArrowDown' });
    fireEvent.keyDown(input, { key: 'Enter' });
    expect(onExecute).toHaveBeenCalled();
  });

  it('shows shortcut hints', () => {
    render(<CommandPalette visible={true} commands={SAMPLE_COMMANDS} onClose={vi.fn()} onExecute={vi.fn()} />);
    expect(screen.getByText('Ctrl+N')).toBeDefined();
  });
});
