import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRecentFiles } from '../../hooks/useRecentFiles';

describe('useRecentFiles', () => {
  it('starts with empty recent files', () => {
    const { result } = renderHook(() => useRecentFiles());
    expect(result.current.recentFiles).toEqual([]);
  });

  it('loads from localStorage', () => {
    const saved = [
      { path: '/test.md', filename: 'test.md', openedAt: 1000 },
    ];
    localStorage.setItem('mdviewer-recent-files', JSON.stringify(saved));
    const { result } = renderHook(() => useRecentFiles());
    expect(result.current.recentFiles).toHaveLength(1);
    expect(result.current.recentFiles[0].path).toBe('/test.md');
  });

  it('adds a file to the front', () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => {
      result.current.addFile('/path/new.md', 'new.md');
    });
    expect(result.current.recentFiles).toHaveLength(1);
    expect(result.current.recentFiles[0].path).toBe('/path/new.md');
    expect(result.current.recentFiles[0].filename).toBe('new.md');
  });

  it('moves existing file to front when added again', () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => {
      result.current.addFile('/a.md', 'a.md');
    });
    act(() => {
      result.current.addFile('/b.md', 'b.md');
    });
    act(() => {
      result.current.addFile('/a.md', 'a.md');
    });
    expect(result.current.recentFiles).toHaveLength(2);
    expect(result.current.recentFiles[0].path).toBe('/a.md');
  });

  it('removes a file', () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => {
      result.current.addFile('/a.md', 'a.md');
      result.current.addFile('/b.md', 'b.md');
    });
    act(() => {
      result.current.removeFile('/a.md');
    });
    expect(result.current.recentFiles).toHaveLength(1);
    expect(result.current.recentFiles[0].path).toBe('/b.md');
  });

  it('clears all files', () => {
    const { result } = renderHook(() => useRecentFiles());
    act(() => {
      result.current.addFile('/a.md', 'a.md');
    });
    act(() => {
      result.current.clearAll();
    });
    expect(result.current.recentFiles).toEqual([]);
  });

  it('limits to 10 files', () => {
    const { result } = renderHook(() => useRecentFiles());
    for (let i = 0; i < 15; i++) {
      act(() => {
        result.current.addFile(`/file${i}.md`, `file${i}.md`);
      });
    }
    expect(result.current.recentFiles).toHaveLength(10);
  });
});
