import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useTabs } from '../../hooks/useTabs';

describe('useTabs', () => {
  it('starts with one untitled tab', () => {
    const { result } = renderHook(() => useTabs());
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.activeTab).toBeDefined();
    expect(result.current.activeTab?.filename).toBe('Untitled');
    expect(result.current.activeTab?.isDirty).toBe(false);
  });

  it('initializes from a recovered session and advances generated IDs', () => {
    const recovered = {
      tabs: [
        { id: 500, path: '/one.md', filename: 'one.md', content: 'one', savedContent: '', isDirty: true },
        { id: 501, path: '/two.md', filename: 'two.md', content: 'two', savedContent: 'two', isDirty: false },
      ],
      activeId: 500,
    };
    const { result } = renderHook(() => useTabs(recovered));

    expect(result.current.tabs).toEqual(recovered.tabs);
    expect(result.current.activeId).toBe(500);
    act(() => { result.current.createTab(); });
    expect(result.current.activeId).toBeGreaterThan(501);
  });

  it('creates a new tab', () => {
    const { result } = renderHook(() => useTabs());
    act(() => {
      result.current.createTab();
    });
    expect(result.current.tabs).toHaveLength(2);
    expect(result.current.activeTab?.id).not.toBe(result.current.tabs[0].id);
  });

  it('creates a tab with overrides', () => {
    const { result } = renderHook(() => useTabs());
    let newTab: ReturnType<typeof result.current.createTab> | undefined;
    act(() => {
      newTab = result.current.createTab({ filename: 'test.md', path: '/path/test.md', content: '# Hello' });
    });
    expect(newTab?.filename).toBe('test.md');
    expect(newTab?.path).toBe('/path/test.md');
    expect(newTab?.content).toBe('# Hello');
  });

  it('closes a tab and switches active', () => {
    const { result } = renderHook(() => useTabs());
    let secondTab: ReturnType<typeof result.current.createTab> | undefined;
    act(() => {
      secondTab = result.current.createTab();
    });
    const firstId = result.current.tabs[0].id;
    act(() => {
      result.current.closeTab(secondTab!.id);
    });
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.activeId).toBe(firstId);
  });

  it('replaces last tab with new untitled when closing the only tab', () => {
    const { result } = renderHook(() => useTabs());
    const onlyId = result.current.activeId;
    act(() => {
      result.current.closeTab(onlyId);
    });
    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.activeId).not.toBe(onlyId);
  });

  it('closes multiple tabs atomically', () => {
    const { result } = renderHook(() => useTabs());
    act(() => { result.current.createTab(); });
    act(() => { result.current.createTab(); });
    const [first, second] = result.current.tabs;

    act(() => { result.current.closeTabs([first.id, second.id]); });

    expect(result.current.tabs).toHaveLength(1);
    expect(result.current.tabs[0].id).not.toBe(first.id);
    expect(result.current.tabs[0].id).not.toBe(second.id);
  });

  it('switches tabs', () => {
    const { result } = renderHook(() => useTabs());
    act(() => {
      result.current.createTab();
    });
    act(() => {
      result.current.switchTab(result.current.tabs[0].id);
    });
    expect(result.current.activeId).toBe(result.current.tabs[0].id);
  });

  it('updates content and marks dirty', () => {
    const { result } = renderHook(() => useTabs());
    const id = result.current.activeId;
    act(() => {
      result.current.updateContent(id, 'new content');
    });
    expect(result.current.activeTab?.content).toBe('new content');
    expect(result.current.activeTab?.isDirty).toBe(true);
  });

  it('marks saved clears dirty flag', () => {
    const { result } = renderHook(() => useTabs());
    const id = result.current.activeId;
    act(() => {
      result.current.updateContent(id, 'new content');
    });
    act(() => {
      result.current.markSaved(id, '/path/saved.md', 'new content');
    });
    expect(result.current.activeTab?.isDirty).toBe(false);
    expect(result.current.activeTab?.path).toBe('/path/saved.md');
  });

  it('does not clear newer edits when an older save finishes', () => {
    const { result } = renderHook(() => useTabs());
    const id = result.current.activeId;
    act(() => {
      result.current.updateContent(id, 'snapshot being saved');
      result.current.updateContent(id, 'newer edit');
    });
    act(() => {
      result.current.markSaved(id, '/path/saved.md', 'snapshot being saved');
    });
    expect(result.current.activeTab?.content).toBe('newer edit');
    expect(result.current.activeTab?.savedContent).toBe('snapshot being saved');
    expect(result.current.activeTab?.isDirty).toBe(true);
  });

  it('opens content in a new tab or reuses empty tab', () => {
    const { result } = renderHook(() => useTabs());
    act(() => {
      result.current.openInTab('/path/file.md', '# Content');
    });
    // openInTab reuses the initial empty tab, so count stays at 1
    expect(result.current.activeTab?.path).toBe('/path/file.md');
    expect(result.current.activeTab?.content).toBe('# Content');
    expect(result.current.activeTab?.isDirty).toBe(false);
  });

  it('keeps a dropped desktop copy unsaved and dirty', () => {
    const { result } = renderHook(() => useTabs());
    act(() => {
      result.current.openInTab(null, '# Dropped', 'dropped.md', true);
    });

    expect(result.current.activeTab).toEqual(expect.objectContaining({
      path: null,
      filename: 'dropped.md',
      content: '# Dropped',
      savedContent: '',
      isDirty: true,
    }));
  });

  it('cycles tabs forward', () => {
    const { result } = renderHook(() => useTabs());
    act(() => { result.current.createTab(); });
    act(() => { result.current.createTab(); });
    const firstId = result.current.tabs[0].id;
    act(() => { result.current.cycleTab(1); });
    expect(result.current.activeId).toBe(firstId);
  });

  it('cycles tabs backward', () => {
    const { result } = renderHook(() => useTabs());
    act(() => { result.current.createTab(); });
    const firstId = result.current.tabs[0].id;
    act(() => { result.current.cycleTab(-1); });
    expect(result.current.activeId).toBe(firstId);
  });
});
