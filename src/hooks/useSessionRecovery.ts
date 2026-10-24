import { useCallback, useEffect, useRef } from 'react';
import type { Tab } from '../types/tab';
import { persistSession } from '../utils/sessionManager';

const RECOVERY_DEBOUNCE_MS = 300;

export function useSessionRecovery(
  tabs: Tab[],
  activeId: number,
  onPersistenceFailure?: () => void
) {
  const persistenceFailedRef = useRef(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      const persistedCompletely = persistSession({ tabs, activeId }, false);
      if (!persistedCompletely && !persistenceFailedRef.current) {
        persistenceFailedRef.current = true;
        onPersistenceFailure?.();
      } else if (persistedCompletely) {
        persistenceFailedRef.current = false;
      }
    }, RECOVERY_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [tabs, activeId, onPersistenceFailure]);

  const markCleanExit = useCallback(() => {
    persistSession({ tabs, activeId }, true);
  }, [tabs, activeId]);

  return { markCleanExit };
}
