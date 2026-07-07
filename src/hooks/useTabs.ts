import { useState, useCallback } from 'react';
import type { Tab, MakeTabOverrides } from '../types/tab';

let nextId = 1;

function makeTab(overrides: MakeTabOverrides = {}): Tab {
  return {
    id: nextId++,
    path: null,
    filename: 'Untitled',
    content: '',
    savedContent: '',
    isDirty: false,
    ...overrides,
  };
}

/**
 * Multi-document tab state management hook.
 */
export function useTabs() {
  const [tabs, setTabs] = useState<Tab[]>(() => [makeTab()]);
  const [activeId, setActiveId] = useState<number>(() => tabs[0]?.id ?? 1);

  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];

  // -- Actions ---------------------------------------------------------------

  const createTab = useCallback((overrides: MakeTabOverrides = {}): Tab => {
    const tab = makeTab(overrides);
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
    return tab;
  }, []);

  const closeTab = useCallback(
    (id: number) => {
      setTabs((prev) => {
        if (prev.length === 1) {
          // Don't close the last tab — reset it instead
          const newTab = makeTab();
          setActiveId(newTab.id);
          return [newTab];
        }
        const idx = prev.findIndex((t) => t.id === id);
        const next = prev.filter((t) => t.id !== id);

        // If closing the active tab, switch to the nearest remaining tab
        if (id === activeId) {
          const newIdx = Math.min(idx, next.length - 1);
          setActiveId(next[newIdx].id);
        }
        return next;
      });
    },
    [activeId]
  );

  const switchTab = useCallback((id: number) => {
    setActiveId(id);
  }, []);

  const updateContent = useCallback((id: number, content: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return {
          ...t,
          content,
          isDirty: content !== t.savedContent,
        };
      })
    );
  }, []);

  const markSaved = useCallback((id: number, path: string | null, content: string) => {
    setTabs((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        const filename = path ? path.split(/[\\/]/).pop() || 'Untitled' : t.filename;
        return {
          ...t,
          path: path || t.path,
          filename,
          content,
          savedContent: content,
          isDirty: false,
        };
      })
    );
  }, []);

  const openInTab = useCallback(
    (path: string | null, content: string): Tab | undefined => {
      // Check if file is already open
      const existing = tabs.find((t) => t.path === path);
      if (existing) {
        setActiveId(existing.id);
        return existing;
      }

      const filename = path ? path.split(/[\\/]/).pop() || 'Untitled' : 'Untitled';

      // If only one tab exists and it's untouched, reuse it
      if (tabs.length === 1 && !tabs[0].isDirty && !tabs[0].path && tabs[0].content === '') {
        const reusedId = tabs[0].id;
        setTabs([
          {
            ...tabs[0],
            path,
            filename,
            content,
            savedContent: content,
            isDirty: false,
          },
        ]);
        setActiveId(reusedId);
        return tabs[0];
      }

      return createTab({ path, filename, content, savedContent: content });
    },
    [tabs, createTab]
  );

  const cycleTab = useCallback(
    (direction: number = 1) => {
      setTabs((prev) => {
        const idx = prev.findIndex((t) => t.id === activeId);
        const next = (idx + direction + prev.length) % prev.length;
        setActiveId(prev[next].id);
        return prev;
      });
    },
    [activeId]
  );

  const reorderTabs = useCallback((fromIdx: number, toIdx: number) => {
    setTabs((prev) => {
      const result = [...prev];
      const [moved] = result.splice(fromIdx, 1);
      result.splice(toIdx, 0, moved);
      return result;
    });
  }, []);

  return {
    tabs,
    activeTab,
    activeId,
    createTab,
    closeTab,
    switchTab,
    updateContent,
    markSaved,
    openInTab,
    cycleTab,
    reorderTabs,
  };
}
