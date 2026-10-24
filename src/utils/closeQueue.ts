import type { Tab } from '../types/tab';

export interface CloseQueue {
  currentTabId: number;
  remainingTabIds: number[];
  isWindowClose: boolean;
}

export interface ClosePlan {
  cleanTabIds: number[];
  queue: CloseQueue | null;
  shouldCloseWindow: boolean;
}

/** Builds one deterministic close sequence from the tab snapshot at request time. */
export function planTabClose(tabs: Tab[], ids: number[], isWindowClose = false): ClosePlan {
  const requested = new Set(ids);
  const matching = tabs.filter((tab) => requested.has(tab.id));
  const dirtyTabIds = matching.filter((tab) => tab.isDirty).map((tab) => tab.id);
  const cleanTabIds = isWindowClose
    ? []
    : matching.filter((tab) => !tab.isDirty).map((tab) => tab.id);

  return {
    cleanTabIds,
    queue: dirtyTabIds.length > 0
      ? {
          currentTabId: dirtyTabIds[0],
          remainingTabIds: dirtyTabIds.slice(1),
          isWindowClose,
        }
      : null,
    shouldCloseWindow: isWindowClose && dirtyTabIds.length === 0,
  };
}

export function advanceTabClose(queue: CloseQueue): {
  queue: CloseQueue | null;
  shouldCloseWindow: boolean;
} {
  const [nextId, ...remainingIds] = queue.remainingTabIds;
  if (nextId === undefined) {
    return { queue: null, shouldCloseWindow: queue.isWindowClose };
  }

  return {
    queue: {
      currentTabId: nextId,
      remainingTabIds: remainingIds,
      isWindowClose: queue.isWindowClose,
    },
    shouldCloseWindow: false,
  };
}
