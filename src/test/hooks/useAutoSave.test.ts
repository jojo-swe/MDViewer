import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useAutoSave } from '../../hooks/useAutoSave';
import type { Tab } from '../../types/tab';

function makeTab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: 1,
    filename: 'test.md',
    content: '# Test',
    savedContent: '# Test',
    isDirty: false,
    path: '/test/test.md',
    ...overrides,
  };
}

describe('useAutoSave', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns idle status when disabled', () => {
    const onSave = vi.fn();
    const tab = makeTab({ isDirty: true });

    const { result } = renderHook(() =>
      useAutoSave(tab, { enabled: false, interval: 1000 }, { onSave })
    );

    expect(result.current.status).toBe('idle');
    expect(onSave).not.toHaveBeenCalled();
  });

  it('returns idle status when tab is not dirty', () => {
    const onSave = vi.fn();
    const tab = makeTab({ isDirty: false });

    const { result } = renderHook(() =>
      useAutoSave(tab, { enabled: true, interval: 1000 }, { onSave })
    );

    expect(result.current.status).toBe('idle');
  });

  it('returns idle status when tab has no path', () => {
    const onSave = vi.fn();
    const tab = makeTab({ isDirty: true, path: null });

    const { result } = renderHook(() =>
      useAutoSave(tab, { enabled: true, interval: 1000 }, { onSave })
    );

    expect(result.current.status).toBe('idle');
  });

  it('triggers save after interval when tab is dirty with path', async () => {
    const onSave = vi.fn().mockResolvedValue(undefined);
    const tab = makeTab({ isDirty: true, path: '/test.md' });

    const { result } = renderHook(() =>
      useAutoSave(tab, { enabled: true, interval: 1000 }, { onSave })
    );

    expect(result.current.status).toBe('idle');

    await act(async () => {
      vi.advanceTimersByTime(1000);
    });

    expect(onSave).toHaveBeenCalledWith(tab);
    expect(result.current.status).toBe('saved');
  });

  it('sets error status when save fails', async () => {
    const onSave = vi.fn().mockRejectedValue(new Error('Save failed'));
    const tab = makeTab({ isDirty: true, path: '/test.md' });

    const { result } = renderHook(() =>
      useAutoSave(tab, { enabled: true, interval: 500 }, { onSave })
    );

    await act(async () => {
      vi.advanceTimersByTime(500);
    });

    expect(result.current.status).toBe('error');
  });

  it('does not save when tab is not dirty even after interval', () => {
    const onSave = vi.fn();
    const tab = makeTab({ isDirty: false, path: '/test.md' });

    renderHook(() =>
      useAutoSave(tab, { enabled: true, interval: 1000 }, { onSave })
    );

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(onSave).not.toHaveBeenCalled();
  });
});
