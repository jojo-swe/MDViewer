import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import EditorModeToggle from '../../components/EditorModeToggle';
import type { EditorMode } from '../../types/settings';

describe('EditorModeToggle', () => {
  it('renders three mode buttons', () => {
    render(<EditorModeToggle mode="wysiwyg" onModeChange={vi.fn()} />);
    expect(screen.getByTitle('WYSIWYG (Ctrl+Alt+1)')).toBeDefined();
    expect(screen.getByTitle('Source (Ctrl+Alt+2)')).toBeDefined();
    expect(screen.getByTitle('Split View (Ctrl+Alt+3)')).toBeDefined();
  });

  it('highlights the active mode', () => {
    render(<EditorModeToggle mode="source" onModeChange={vi.fn()} />);
    const sourceBtn = screen.getByTitle('Source (Ctrl+Alt+2)');
    expect(sourceBtn.classList.contains('mode-btn--active')).toBe(true);
  });

  it('calls onModeChange when clicking a mode', () => {
    const onModeChange = vi.fn();
    render(<EditorModeToggle mode="wysiwyg" onModeChange={onModeChange} />);
    fireEvent.click(screen.getByTitle('Source (Ctrl+Alt+2)'));
    expect(onModeChange).toHaveBeenCalledWith('source');
  });

  it('calls onModeChange with split when clicking split', () => {
    const onModeChange = vi.fn();
    render(<EditorModeToggle mode="wysiwyg" onModeChange={onModeChange} />);
    fireEvent.click(screen.getByTitle('Split View (Ctrl+Alt+3)'));
    expect(onModeChange).toHaveBeenCalledWith('split' as EditorMode);
  });
});
