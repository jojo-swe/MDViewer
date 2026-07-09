import { useEffect, useRef, useState, useCallback } from 'react';
import type { Tab } from '../types/tab';

export type AutoSaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface AutoSaveOptions {
  enabled: boolean;
  interval: number;
}

interface AutoSaveCallbacks {
  onSave: (tab: Tab) => void | Promise<void>;
}

/**
 * Auto-saves the active tab after a debounce interval when it becomes dirty.
 * Only triggers if the tab has a file path (no Save As dialog).
 */
export function useAutoSave(
  activeTab: Tab | null,
  { enabled, interval }: AutoSaveOptions,
  { onSave }: AutoSaveCallbacks
) {
  const [status, setStatus] = useState<AutoSaveStatus>('idle');
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSavedTabRef = useRef<Tab | null>(null);
  const wasDirtyRef = useRef(false);

  const clearTimer = useCallback(() => {
    if (timerRef.current !== null) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  }, []);

  const performSave = useCallback(async () => {
    if (!activeTab || !activeTab.path || !activeTab.isDirty) return;

    setStatus('saving');
    try {
      await onSave(activeTab);
      setStatus('saved');
      lastSavedTabRef.current = activeTab;
      wasDirtyRef.current = false;
    } catch {
      setStatus('error');
    }
  }, [activeTab, onSave]);

  useEffect(() => {
    if (!enabled || !activeTab) {
      clearTimer();
      return;
    }

    if (!activeTab.path || !activeTab.isDirty) {
      clearTimer();
      return;
    }

    clearTimer();
    timerRef.current = setTimeout(() => {
      void performSave();
    }, interval);

    return () => clearTimer();
  }, [enabled, activeTab, interval, clearTimer, performSave]);

  return { status };
}
