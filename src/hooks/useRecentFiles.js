import { useState, useCallback, useEffect } from 'react';

const MAX_RECENT = 10;
const STORAGE_KEY = 'mdviewer-recent-files';

/**
 * Manages the list of recently opened files.
 * Uses localStorage in browser, Tauri Store when available.
 */
export function useRecentFiles() {
  const [recentFiles, setRecentFiles] = useState([]);

  // Load recent files on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        setRecentFiles(JSON.parse(stored));
      }
    } catch {
      // Ignore parse errors
    }
  }, []);

  // Persist whenever the list changes
  const persist = useCallback((files) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(files));
    } catch {
      // Ignore storage errors
    }
  }, []);

  const addFile = useCallback(
    (path, filename) => {
      if (!path) return;
      setRecentFiles((prev) => {
        const filtered = prev.filter((f) => f.path !== path);
        const updated = [
          { path, filename: filename || path.split(/[\\/]/).pop(), openedAt: Date.now() },
          ...filtered,
        ].slice(0, MAX_RECENT);
        persist(updated);
        return updated;
      });
    },
    [persist]
  );

  const removeFile = useCallback(
    (path) => {
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
