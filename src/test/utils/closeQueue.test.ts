import { describe, expect, it } from 'vitest';
import type { Tab } from '../../types/tab';
import { advanceTabClose, planTabClose } from '../../utils/closeQueue';

function tab(id: number, isDirty: boolean): Tab {
  return {
    id,
    path: `/docs/${id}.md`,
    filename: `${id}.md`,
    content: isDirty ? 'changed' : 'saved',
    savedContent: 'saved',
    isDirty,
  };
}

describe('closeQueue', () => {
  const tabs = [tab(1, false), tab(2, true), tab(3, false), tab(4, true)];

  it('closes clean tabs immediately and queues dirty tabs in tab order', () => {
    const plan = planTabClose(tabs, [4, 3, 2, 1]);

    expect(plan.cleanTabIds).toEqual([1, 3]);
    expect(plan.queue).toEqual({
      currentTabId: 2,
      remainingTabIds: [4],
      isWindowClose: false,
    });
    expect(plan.shouldCloseWindow).toBe(false);
  });

  it('leaves clean tabs intact while a window-close queue is unresolved', () => {
    const plan = planTabClose(tabs, tabs.map((item) => item.id), true);

    expect(plan.cleanTabIds).toEqual([]);
    expect(plan.queue?.currentTabId).toBe(2);
    expect(plan.queue?.remainingTabIds).toEqual([4]);
  });

  it('allows an immediate window close when nothing is dirty', () => {
    const plan = planTabClose([tab(1, false)], [1], true);

    expect(plan.queue).toBeNull();
    expect(plan.shouldCloseWindow).toBe(true);
  });

  it('advances one dirty tab at a time and closes the window only at the end', () => {
    const initial = planTabClose(tabs, tabs.map((item) => item.id), true).queue!;
    const next = advanceTabClose(initial);
    const finished = advanceTabClose(next.queue!);

    expect(next.queue?.currentTabId).toBe(4);
    expect(next.shouldCloseWindow).toBe(false);
    expect(finished.queue).toBeNull();
    expect(finished.shouldCloseWindow).toBe(true);
  });
});
