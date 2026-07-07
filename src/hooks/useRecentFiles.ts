import { useState, useCallback } from 'react';
import type { RecentFile } from '../types/settings';

const MAX_RECENT = 10;
const STORAGE_KEY = 'mdviewer-recent-files';

/**
 * Manages the list of recently opened files.
 * Uses localStorage in browser, Tauri Store when available.
 */
export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored) as RecentFile[];
      }
    } catch {
      // Ignore parse errors
    }
    return [];
  });

  // Persist whenever the list changes
  const persist = useCallback((files: RecentFile[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const addFile = useCallback(
    (path: string, filename?: string) => {
      if (!path) return;
      setRecentFiles((prev) => {
        const filtered = prev.filter((f) => f.path !== path);
        const updated: RecentFile[] = [
          { path, filename: filename || path.split(/[\\/]/).pop() || 'Untitled', openedAt: Date.now() },
          ...filtered,
        ].slice(0, MAX_RECENT);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const removeFile = useCallback(
    (path: string) => {
      setRecentFiles((prev) => {
        const updated = prev.filter((f) => f.path !== path);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const clearAll = useCallback(() => {
    setRecentFiles([]);
    persist([]);
  }, [persist]);

  return { recentFiles, addFile, removeFile, clearAll };
}
