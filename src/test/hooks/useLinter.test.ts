import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useLinter } from '../../hooks/useLinter';

describe('useLinter', () => {
  it('returns empty results initially', () => {
    const { result } = renderHook(() => useLinter({ strictness: 'standard', enabled: true }));
    expect(result.current.results.issues).toHaveLength(0);
    expect(result.current.results.summary).toEqual({ errors: 0, warnings: 0, infos: 0 });
  });

  it('lints markdown and returns results after debounce', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLinter({ strictness: 'relaxed', enabled: true }));
    act(() => {
      result.current.lint('# Title\n\n### Jump\n');
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.results.issues.length).toBeGreaterThan(0);
    vi.useRealTimers();
  });

  it('returns empty results when disabled', async () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useLinter({ strictness: 'relaxed', enabled: false }));
    act(() => {
      result.current.lint('# Title\n\n### Jump\n');
    });
    act(() => {
      vi.advanceTimersByTime(500);
    });
    expect(result.current.results.issues).toHaveLength(0);
    vi.useRealTimers();
  });

  it('lint callback is stable (does not change between renders)', () => {
    const { result, rerender } = renderHook(() => useLinter({ strictness: 'standard', enabled: true }));
    const firstLint = result.current.lint;
    rerender();
    expect(result.current.lint).toBe(firstLint);
  });
});
