import { act, renderHook } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useSessionRecovery } from '../../hooks/useSessionRecovery';
import { loadRecoverySession, SESSION_STORAGE_KEY } from '../../utils/sessionManager';
import type { Tab } from '../../types/tab';

const draft: Tab = {
  id: 10,
  path: '/draft.md',
  filename: 'draft.md',
  content: 'unsaved',
  savedContent: 'saved',
  isDirty: true,
};

describe('useSessionRecovery', () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it('debounces running snapshots and can mark the latest state clean', () => {
    const { result, rerender } = renderHook(
      ({ tabs }) => useSessionRecovery(tabs, tabs[0].id),
      { initialProps: { tabs: [draft] } }
    );
    const newer = { ...draft, content: 'newer unsaved content' };
    rerender({ tabs: [newer] });

    act(() => vi.advanceTimersByTime(300));
    expect(loadRecoverySession().state?.tabs[0].content).toBe('newer unsaved content');

    act(() => result.current.markCleanExit());
    expect(loadRecoverySession().state).toBeNull();
    expect(JSON.parse(localStorage.getItem(SESSION_STORAGE_KEY)!).cleanExit).toBe(true);
  });
});
