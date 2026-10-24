import type { RecoveryResult, SessionSnapshot, TabSessionState } from '../types/session';
import type { Tab } from '../types/tab';

export const SESSION_STORAGE_KEY = 'mdviewer-recovery-session';
export const MAX_RECOVERY_TABS = 50;
export const MAX_RECOVERY_CHARACTERS = 5_000_000;
const MAX_RECOVERY_SERIALIZED_CHARACTERS = 4_500_000;

interface SessionStorage {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
}

function isTab(value: unknown): value is Tab {
  if (!value || typeof value !== 'object') return false;
  const tab = value as Partial<Tab>;
  return typeof tab.id === 'number'
    && Number.isSafeInteger(tab.id)
    && tab.id > 0
    && (typeof tab.path === 'string' || tab.path === null)
    && typeof tab.filename === 'string'
    && typeof tab.content === 'string'
    && typeof tab.savedContent === 'string'
    && typeof tab.isDirty === 'boolean';
}

function tabSize(tab: Tab): number {
  return JSON.stringify(tab).length;
}

function selectBoundedTabs(tabs: Tab[], activeId: number): { tabs: Tab[]; incomplete: boolean } {
  const indexed = tabs.map((tab, index) => ({ tab, index }));
  const prioritized = [...indexed].sort((left, right) => {
    const priority = (tab: Tab) => [tab.isDirty ? 0 : 1, tab.id === activeId ? 0 : 1];
    const leftPriority = priority(left.tab);
    const rightPriority = priority(right.tab);
    return leftPriority[0] - rightPriority[0]
      || leftPriority[1] - rightPriority[1]
      || left.index - right.index;
  });

  let characters = 0;
  const selected = new Set<number>();
  for (const { tab } of prioritized) {
    if (selected.size >= MAX_RECOVERY_TABS) break;
    const size = tabSize(tab);
    if (characters + size > MAX_RECOVERY_SERIALIZED_CHARACTERS) continue;
    characters += size;
    selected.add(tab.id);
  }

  const bounded = indexed.filter(({ tab }) => selected.has(tab.id)).map(({ tab }) => ({ ...tab }));
  return {
    tabs: bounded,
    incomplete: bounded.length !== tabs.length,
  };
}

function dropLeastImportantTab(snapshot: SessionSnapshot): SessionSnapshot | null {
  if (snapshot.tabs.length <= 1) return null;
  const priority = (tab: Tab) => (tab.isDirty ? 0 : 2) + (tab.id === snapshot.activeId ? 0 : 1);
  let dropIndex = 0;
  for (let index = 1; index < snapshot.tabs.length; index += 1) {
    if (priority(snapshot.tabs[index]) >= priority(snapshot.tabs[dropIndex])) {
      dropIndex = index;
    }
  }
  const tabs = snapshot.tabs.filter((_, index) => index !== dropIndex);
  return {
    ...snapshot,
    tabs,
    activeId: tabs.some((tab) => tab.id === snapshot.activeId)
      ? snapshot.activeId
      : tabs[0]?.id ?? 0,
    incomplete: true,
  };
}

export function createSessionSnapshot(
  tabs: Tab[],
  activeId: number,
  cleanExit: boolean,
  updatedAt = Date.now()
): SessionSnapshot {
  const bounded = selectBoundedTabs(tabs, activeId);
  const restoredActiveId = bounded.tabs.some((tab) => tab.id === activeId)
    ? activeId
    : bounded.tabs[0]?.id ?? 0;

  return {
    version: 1,
    updatedAt,
    cleanExit,
    incomplete: bounded.incomplete,
    tabs: bounded.tabs,
    activeId: restoredActiveId,
  };
}

export function persistSession(
  state: TabSessionState,
  cleanExit: boolean,
  storage: SessionStorage = localStorage
): boolean {
  if (cleanExit) {
    try {
      storage.removeItem(SESSION_STORAGE_KEY);
      return true;
    } catch {
      return false;
    }
  }

  let snapshot = createSessionSnapshot(state.tabs, state.activeId, false);
  try {
    while (true) {
      try {
        storage.setItem(SESSION_STORAGE_KEY, JSON.stringify(snapshot));
        return !snapshot.incomplete;
      } catch {
        const reduced = dropLeastImportantTab(snapshot);
        if (!reduced) return false;
        snapshot = reduced;
      }
    }
  } catch {
    return false;
  }
}

export function loadRecoverySession(
  storage: SessionStorage = localStorage
): RecoveryResult {
  try {
    const raw = storage.getItem(SESSION_STORAGE_KEY);
    if (!raw) return { state: null, incomplete: false };
    const snapshot = JSON.parse(raw) as Partial<SessionSnapshot>;
    if (snapshot.version !== 1
      || snapshot.cleanExit !== false
      || !Array.isArray(snapshot.tabs)
      || !snapshot.tabs.every(isTab)
      || typeof snapshot.activeId !== 'number') {
      return { state: null, incomplete: false };
    }

    const uniqueIds = new Set(snapshot.tabs.map((tab) => tab.id));
    if (uniqueIds.size !== snapshot.tabs.length || !uniqueIds.has(snapshot.activeId)) {
      return { state: null, incomplete: false };
    }

    // Only restore an unclean session when it contains actual unsaved work.
    if (!snapshot.tabs.some((tab) => tab.isDirty)) {
      return { state: null, incomplete: false };
    }

    return {
      state: { tabs: snapshot.tabs.map((tab) => ({ ...tab })), activeId: snapshot.activeId },
      incomplete: snapshot.incomplete === true,
    };
  } catch {
    return { state: null, incomplete: false };
  }
}
