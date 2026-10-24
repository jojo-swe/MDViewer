import { useState, useCallback } from 'react';
import type { Tab, MakeTabOverrides } from '../types/tab';
import type { TabSessionState } from '../types/session';

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
function prepareInitialState(initialState?: TabSessionState | null): TabSessionState {
  if (initialState?.tabs.length && initialState.tabs.some((tab) => tab.id === initialState.activeId)) {
    const tabs = initialState.tabs.map((tab) => ({ ...tab }));
    nextId = Math.max(nextId, ...tabs.map((tab) => tab.id + 1));
    return { tabs, activeId: initialState.activeId };
  }
  const tab = makeTab();
  return { tabs: [tab], activeId: tab.id };
}

export function useTabs(restoredState?: TabSessionState | null) {
  const [initialState] = useState(() => prepareInitialState(restoredState));
  const [tabs, setTabs] = useState<Tab[]>(initialState.tabs);
  const [activeId, setActiveId] = useState<number>(initialState.activeId);

  const activeTab = tabs.find((t) => t.id === activeId) || tabs[0];

  // -- Actions ---------------------------------------------------------------

  const createTab = useCallback((overrides: MakeTabOverrides = {}): Tab => {
    const tab = makeTab(overrides);
    setTabs((prev) => [...prev, tab]);
    setActiveId(tab.id);
    return tab;
  }, []);

  const closeTabs = useCallback((ids: number[]) => {
    const targets = new Set(ids);
    setTabs((prev) => {
      const firstRemovedIndex = prev.findIndex((tab) => targets.has(tab.id));
      if (firstRemovedIndex === -1) return prev;

      let next = prev.filter((tab) => !targets.has(tab.id));
      if (next.length === 0) next = [makeTab()];

      setActiveId((current) => {
        if (next.some((tab) => tab.id === current)) return current;
        return next[Math.min(firstRemovedIndex, next.length - 1)].id;
      });
      return next;
    });
  }, []);

  const closeTab = useCallback((id: number) => closeTabs([id]), [closeTabs]);

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
          savedContent: content,
          // A save can finish after the user has typed more. Preserve the
          // current content and only clear dirty state when that exact snapshot
          // is still current.
          isDirty: t.content !== content,
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
    closeTabs,
    switchTab,
    updateContent,
    markSaved,
    openInTab,
    cycleTab,
    reorderTabs,
  };
}
