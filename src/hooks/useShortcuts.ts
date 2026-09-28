import { useCallback, useMemo } from 'react';
import type { Command, CommandContext } from '../types/command';

export interface ParsedShortcut {
  ctrl: boolean;
  shift: boolean;
  alt: boolean;
  meta: boolean;
  key: string;
}

export const DEFAULT_SHORTCUTS: Record<string, string> = {
  'file.new': 'Ctrl+N',
  'file.open': 'Ctrl+O',
  'file.save': 'Ctrl+S',
  'file.saveAs': 'Ctrl+Shift+S',
  'file.exportPDF': 'Ctrl+Shift+E',
  'file.closeTab': 'Ctrl+W',
  'edit.find': 'Ctrl+F',
  'edit.replace': 'Ctrl+H',
  'view.toggleSidebar': 'Ctrl+B',
  'view.toggleOutline': 'Ctrl+Shift+O',
  'view.toggleSettings': 'Ctrl+,',
  'view.commandPalette': 'Ctrl+Shift+P',
  'view.cycleTabs': 'Ctrl+Tab',
  'view.cycleTabsPrev': 'Ctrl+Shift+Tab',
  'view.wysiwyg': 'Ctrl+Alt+1',
  'view.source': 'Ctrl+Alt+2',
  'view.split': 'Ctrl+Alt+3',
};

export function parseShortcut(combo: string): ParsedShortcut {
  const parts = combo.split('+').map((p) => p.trim());
  const result: ParsedShortcut = {
    ctrl: false,
    shift: false,
    alt: false,
    meta: false,
    key: '',
  };

  for (const part of parts) {
    switch (part.toLowerCase()) {
      case 'ctrl':
        result.ctrl = true;
        break;
      case 'shift':
        result.shift = true;
        break;
      case 'alt':
        result.alt = true;
        break;
      case 'meta':
      case 'cmd':
        result.meta = true;
        break;
      default:
        result.key = part.toLowerCase();
    }
  }

  return result;
}

export function shortcutToString(parsed: ParsedShortcut): string {
  const parts: string[] = [];
  if (parsed.ctrl) parts.push('Ctrl');
  if (parsed.shift) parts.push('Shift');
  if (parsed.alt) parts.push('Alt');
  if (parsed.meta) parts.push('Meta');
  if (parsed.key) parts.push(parsed.key.length === 1 ? parsed.key.toUpperCase() : parsed.key);
  return parts.join('+');
}

export function parseShortcutFromEvent(e: { ctrlKey: boolean; shiftKey: boolean; altKey: boolean; metaKey: boolean; key: string }): ParsedShortcut {
  return {
    ctrl: e.ctrlKey || e.metaKey,
    shift: e.shiftKey,
    alt: e.altKey,
    meta: e.metaKey,
    key: e.key.toLowerCase(),
  };
}

export function detectConflicts(
  shortcuts: Record<string, string>
): Map<string, string[]> {
  const comboToActions = new Map<string, string[]>();
  for (const [action, combo] of Object.entries(shortcuts)) {
    const existing = comboToActions.get(combo) || [];
    existing.push(action);
    comboToActions.set(combo, existing);
  }

  const conflicts = new Map<string, string[]>();
  for (const [, actions] of comboToActions) {
    if (actions.length > 1) {
      for (const action of actions) {
        conflicts.set(action, actions.filter((a) => a !== action));
      }
    }
  }
  return conflicts;
}

function matchesShortcut(e: KeyboardEvent, parsed: ParsedShortcut): boolean {
  const isMod = e.ctrlKey || e.metaKey;
  if (parsed.ctrl !== isMod) return false;
  if (parsed.shift !== e.shiftKey) return false;
  if (parsed.alt !== e.altKey) return false;
  return e.key.toLowerCase() === parsed.key;
}

export function useShortcuts(
  commands: Command[],
  context: CommandContext,
  customShortcuts: Record<string, string>
) {
  const merged = useMemo(() => {
    const result = { ...DEFAULT_SHORTCUTS };
    for (const [action, combo] of Object.entries(customShortcuts)) {
      if (combo) {
        result[action] = combo;
      } else {
        delete result[action];
      }
    }
    return result;
  }, [customShortcuts]);

  const actionMap = useMemo(() => {
    const map = new Map<string, (ctx: CommandContext) => void>();
    for (const cmd of commands) {
      map.set(cmd.id, cmd.action);
    }
    return map;
  }, [commands]);

  const handleKeyDown = useCallback((e: KeyboardEvent): boolean => {
    for (const [actionId, combo] of Object.entries(merged)) {
      const parsed = parseShortcut(combo);
      if (matchesShortcut(e, parsed)) {
        const action = actionMap.get(actionId);
        if (action) {
          e.preventDefault();
          action(context);
          return true;
        }
      }
    }
    return false;
  }, [merged, actionMap, context]);

  return { handleKeyDown, shortcuts: merged };
}
