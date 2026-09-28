import { useState, useCallback, useEffect, useRef } from 'react';

export interface ContextMenuItem {
  id: string;
  label?: string;
  icon?: React.ReactNode;
  onClick?: () => void;
  separator?: boolean;
  disabled?: boolean;
  danger?: boolean;
}

export interface MenuState {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
}

const INITIAL_STATE: MenuState = {
  visible: false,
  x: 0,
  y: 0,
  items: [],
};

export function useContextMenu() {
  const [menuState, setMenuState] = useState<MenuState>(INITIAL_STATE);
  const menuRef = useRef<HTMLDivElement>(null);

  const showMenu = useCallback((x: number, y: number, items: ContextMenuItem[]) => {
    const adjusted = adjustForViewport(x, y, items.length);
    setMenuState({ visible: true, x: adjusted.x, y: adjusted.y, items });
  }, []);

  const hideMenu = useCallback(() => {
    setMenuState((prev) => ({ ...prev, visible: false }));
  }, []);

  useEffect(() => {
    if (!menuState.visible) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        hideMenu();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') hideMenu();
    };

    const handleScroll = () => hideMenu();

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    window.addEventListener('scroll', handleScroll, true);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
      window.removeEventListener('scroll', handleScroll, true);
    };
  }, [menuState.visible, hideMenu]);

  return { menuState, menuRef, showMenu, hideMenu };
}

function adjustForViewport(x: number, y: number, itemCount: number): { x: number; y: number } {
  const estimatedWidth = 200;
  const estimatedItemHeight = 32;
  const estimatedHeight = itemCount * estimatedItemHeight + 8;

  let adjustedX = x;
  let adjustedY = y;

  if (x + estimatedWidth > window.innerWidth) {
    adjustedX = window.innerWidth - estimatedWidth - 4;
  }
  if (y + estimatedHeight > window.innerHeight) {
    adjustedY = window.innerHeight - estimatedHeight - 4;
  }

  adjustedX = Math.max(4, adjustedX);
  adjustedY = Math.max(4, adjustedY);

  return { x: adjustedX, y: adjustedY };
}
