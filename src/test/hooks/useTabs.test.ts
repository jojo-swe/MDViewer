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
