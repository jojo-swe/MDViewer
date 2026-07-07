import { describe, it, expect, vi, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useToast } from '../../hooks/useToast';

describe('useToast', () => {
  afterEach(() => {
    vi.useRealTimers();
  });

  it('starts with no toasts', () => {
    const { result } = renderHook(() => useToast());
    expect(result.current.toasts).toHaveLength(0);
  });

  it('adds a success toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('Done!');
    });
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].message).toBe('Done!');
  });

  it('adds an error toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.error('Failed!');
    });
    expect(result.current.toasts[0].type).toBe('error');
  });

  it('adds a warning toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.warning('Careful!');
    });
    expect(result.current.toasts[0].type).toBe('warning');
  });

  it('adds an info toast', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.info('FYI');
    });
    expect(result.current.toasts[0].type).toBe('info');
  });

  it('dismisses a toast by id', () => {
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('Test');
    });
    const toastId = result.current.toasts[0].id;
    act(() => {
      result.current.dismiss(toastId);
    });
    expect(result.current.toasts).toHaveLength(0);
  });

  it('auto-dismisses after timeout', () => {
    vi.useFakeTimers();
    const { result } = renderHook(() => useToast());
    act(() => {
      result.current.success('Temp');
    });
    expect(result.current.toasts).toHaveLength(1);
    act(() => {
      vi.advanceTimersByTime(4000);
    });
    expect(result.current.toasts).toHaveLength(0);
  });
});
