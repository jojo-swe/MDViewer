import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import WelcomeScreen from '../../components/WelcomeScreen';
import type { RecentFile } from '../../types/settings';

describe('WelcomeScreen', () => {
  it('renders app title and new file button', () => {
    render(<WelcomeScreen recentFiles={[]} onOpenFile={vi.fn()} onOpenRecent={vi.fn()} onNewFile={vi.fn()} onClearRecent={vi.fn()} />);
    expect(screen.getByText('MDViewer')).toBeDefined();
    expect(screen.getByText('New Document')).toBeDefined();
  });

  it('renders open file button', () => {
    render(<WelcomeScreen recentFiles={[]} onOpenFile={vi.fn()} onOpenRecent={vi.fn()} onNewFile={vi.fn()} onClearRecent={vi.fn()} />);
    expect(screen.getByText('Open File')).toBeDefined();
  });

  it('calls onNewFile when clicking new document', () => {
    const onNewFile = vi.fn();
    render(<WelcomeScreen recentFiles={[]} onOpenFile={vi.fn()} onOpenRecent={vi.fn()} onNewFile={onNewFile} onClearRecent={vi.fn()} />);
    fireEvent.click(screen.getByText('New Document'));
    expect(onNewFile).toHaveBeenCalled();
  });

  it('calls onOpenFile when clicking open file', () => {
    const onOpenFile = vi.fn();
    render(<WelcomeScreen recentFiles={[]} onOpenFile={onOpenFile} onOpenRecent={vi.fn()} onNewFile={vi.fn()} onClearRecent={vi.fn()} />);
    fireEvent.click(screen.getByText('Open File'));
    expect(onOpenFile).toHaveBeenCalled();
  });

  it('shows recent files when provided', () => {
    const recentFiles: RecentFile[] = [
      { path: '/docs/readme.md', filename: 'readme.md', openedAt: Date.now() - 1000 },
    ];
    render(<WelcomeScreen recentFiles={recentFiles} onOpenFile={vi.fn()} onOpenRecent={vi.fn()} onNewFile={vi.fn()} onClearRecent={vi.fn()} />);
    expect(screen.getByText('readme.md')).toBeDefined();
  });

  it('calls onOpenRecent when clicking a recent file', () => {
    const onOpenRecent = vi.fn();
    const recentFiles: RecentFile[] = [
      { path: '/docs/readme.md', filename: 'readme.md', openedAt: Date.now() },
    ];
    render(<WelcomeScreen recentFiles={recentFiles} onOpenFile={vi.fn()} onOpenRecent={onOpenRecent} onNewFile={vi.fn()} onClearRecent={vi.fn()} />);
    fireEvent.click(screen.getByText('readme.md'));
    expect(onOpenRecent).toHaveBeenCalledWith('/docs/readme.md');
  });

  it('does not show recent files section when empty', () => {
    render(<WelcomeScreen recentFiles={[]} onOpenFile={vi.fn()} onOpenRecent={vi.fn()} onNewFile={vi.fn()} onClearRecent={vi.fn()} />);
    expect(screen.queryByText('Recent Files')).toBeNull();
  });

  it('shows relative time for recent files', () => {
    const now = Date.now();
    const recentFiles: RecentFile[] = [
      { path: '/docs/just-now.md', filename: 'just-now.md', openedAt: now },
      { path: '/docs/minutes.md', filename: 'minutes.md', openedAt: now - 120000 },
      { path: '/docs/hours.md', filename: 'hours.md', openedAt: now - 7200000 },
      { path: '/docs/days.md', filename: 'days.md', openedAt: now - 172800000 },
    ];
    render(<WelcomeScreen recentFiles={recentFiles} onOpenFile={vi.fn()} onOpenRecent={vi.fn()} onNewFile={vi.fn()} onClearRecent={vi.fn()} />);
    expect(screen.getByText('Just now')).toBeDefined();
    expect(screen.getByText('2m ago')).toBeDefined();
    expect(screen.getByText('2h ago')).toBeDefined();
    expect(screen.getByText('2d ago')).toBeDefined();
  });

  it('calls onClearRecent when clicking clear button', () => {
    const onClearRecent = vi.fn();
    const recentFiles: RecentFile[] = [
      { path: '/docs/readme.md', filename: 'readme.md', openedAt: Date.now() },
    ];
    render(<WelcomeScreen recentFiles={recentFiles} onOpenFile={vi.fn()} onOpenRecent={vi.fn()} onNewFile={vi.fn()} onClearRecent={onClearRecent} />);
    fireEvent.click(screen.getByText('Clear'));
    expect(onClearRecent).toHaveBeenCalled();
  });
});
