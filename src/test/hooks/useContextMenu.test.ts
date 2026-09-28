import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useContextMenu } from '../../hooks/useContextMenu';

describe('useContextMenu', () => {
  it('starts with invisible menu', () => {
    const { result } = renderHook(() => useContextMenu());
    expect(result.current.menuState.visible).toBe(false);
    expect(result.current.menuState.items).toEqual([]);
  });

  it('showMenu sets visible, position, and items', () => {
    const { result } = renderHook(() => useContextMenu());
    act(() => {
      result.current.showMenu(100, 200, [
        { id: 'test', label: 'Test', onClick: vi.fn() },
      ]);
    });
    expect(result.current.menuState.visible).toBe(true);
    expect(result.current.menuState.x).toBe(100);
    expect(result.current.menuState.y).toBe(200);
    expect(result.current.menuState.items).toHaveLength(1);
    expect(result.current.menuState.items[0].id).toBe('test');
  });

  it('hideMenu sets visible to false', () => {
    const { result } = renderHook(() => useContextMenu());
    act(() => {
      result.current.showMenu(50, 50, [{ id: 'a', label: 'A' }]);
    });
    expect(result.current.menuState.visible).toBe(true);
    act(() => {
      result.current.hideMenu();
    });
    expect(result.current.menuState.visible).toBe(false);
  });

  it('adjusts position when menu would overflow viewport', () => {
    const { result } = renderHook(() => useContextMenu());
    act(() => {
      result.current.showMenu(window.innerWidth - 10, window.innerHeight - 10, [
        { id: 'a', label: 'A' },
        { id: 'b', label: 'B' },
        { id: 'c', label: 'C' },
      ]);
    });
    expect(result.current.menuState.x).toBeLessThan(window.innerWidth - 10);
    expect(result.current.menuState.y).toBeLessThan(window.innerHeight - 10);
  });

  it('clamps position to minimum 4', () => {
    const { result } = renderHook(() => useContextMenu());
    act(() => {
      result.current.showMenu(-50, -50, [{ id: 'a', label: 'A' }]);
    });
    expect(result.current.menuState.x).toBe(4);
    expect(result.current.menuState.y).toBe(4);
  });
});
