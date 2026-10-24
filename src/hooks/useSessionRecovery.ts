import { useCallback, useEffect } from 'react';
import type { Tab } from '../types/tab';
import { persistSession } from '../utils/sessionManager';

const RECOVERY_DEBOUNCE_MS = 300;

export function useSessionRecovery(tabs: Tab[], activeId: number) {
  useEffect(() => {
    const timer = setTimeout(() => {
      persistSession({ tabs, activeId }, false);
    }, RECOVERY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [tabs, activeId]);

  const markCleanExit = useCallback(() => {
    persistSession({ tabs, activeId }, true);
  }, [tabs, activeId]);

  return { markCleanExit };
}
