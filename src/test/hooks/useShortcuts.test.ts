import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import {
  parseShortcut,
  shortcutToString,
  detectConflicts,
  DEFAULT_SHORTCUTS,
  useShortcuts,
} from '../../hooks/useShortcuts';
import type { Command, CommandContext } from '../../types/command';

function makeMockContext(): CommandContext {
  return {
    openFile: vi.fn(),
    saveFile: vi.fn(),
    saveFileAs: vi.fn(),
    newTab: vi.fn(),
    closeTab: vi.fn(),
    exportPDF: vi.fn(),
    toggleSidebar: vi.fn(),
    toggleFind: vi.fn(),
    toggleSettings: vi.fn(),
    cycleTabs: vi.fn(),
    setEditorMode: vi.fn(),
    toggleLint: vi.fn(),
    setStrictness: vi.fn(),
    resetSettings: vi.fn(),
    toggleWordWrap: vi.fn(),
    toggleOutline: vi.fn(),
    toggleCommandPalette: vi.fn(),
  };
}

function makeMockCommands(ctx: CommandContext): Command[] {
  return [
    { id: 'file.new', title: 'New Tab', category: 'file', action: () => ctx.newTab() },
    { id: 'file.open', title: 'Open File', category: 'file', action: () => ctx.openFile() },
    { id: 'file.save', title: 'Save', category: 'file', action: () => ctx.saveFile() },
  ];
}

describe('useShortcuts', () => {
  describe('parseShortcut', () => {
    it('parses Ctrl+Shift+P', () => {
      const result = parseShortcut('Ctrl+Shift+P');
      expect(result.ctrl).toBe(true);
      expect(result.shift).toBe(true);
      expect(result.alt).toBe(false);
      expect(result.key).toBe('p');
    });

    it('parses Ctrl+S', () => {
      const result = parseShortcut('Ctrl+S');
      expect(result.ctrl).toBe(true);
      expect(result.shift).toBe(false);
      expect(result.key).toBe('s');
    });

    it('parses Ctrl+Alt+1', () => {
      const result = parseShortcut('Ctrl+Alt+1');
      expect(result.ctrl).toBe(true);
      expect(result.alt).toBe(true);
      expect(result.key).toBe('1');
    });

    it('parses Ctrl+,', () => {
      const result = parseShortcut('Ctrl+,');
      expect(result.ctrl).toBe(true);
      expect(result.key).toBe(',');
    });

    it('parses Ctrl+Tab', () => {
      const result = parseShortcut('Ctrl+Tab');
      expect(result.ctrl).toBe(true);
      expect(result.key).toBe('tab');
    });
  });

  describe('shortcutToString', () => {
    it('converts parsed shortcut back to string', () => {
      const parsed = parseShortcut('Ctrl+Shift+P');
      expect(shortcutToString(parsed)).toBe('Ctrl+Shift+P');
    });

    it('capitalizes single-char keys', () => {
      const parsed = parseShortcut('Ctrl+s');
      expect(shortcutToString(parsed)).toBe('Ctrl+S');
    });
  });

  describe('detectConflicts', () => {
    it('returns empty map when no conflicts', () => {
      const conflicts = detectConflicts({
        'file.new': 'Ctrl+N',
        'file.save': 'Ctrl+S',
      });
      expect(conflicts.size).toBe(0);
    });

    it('detects when two actions share the same combo', () => {
      const conflicts = detectConflicts({
        'file.new': 'Ctrl+N',
        'file.open': 'Ctrl+N',
      });
      expect(conflicts.size).toBe(2);
      expect(conflicts.get('file.new')).toEqual(['file.open']);
      expect(conflicts.get('file.open')).toEqual(['file.new']);
    });

    it('handles multiple actions sharing same combo', () => {
      const conflicts = detectConflicts({
        'a': 'Ctrl+X',
        'b': 'Ctrl+X',
        'c': 'Ctrl+X',
      });
      expect(conflicts.get('a')).toEqual(['b', 'c']);
    });
  });

  describe('useShortcuts hook', () => {
    it('returns merged shortcuts with defaults', () => {
      const ctx = makeMockContext();
      const commands = makeMockCommands(ctx);
      const { result } = renderHook(() => useShortcuts(commands, ctx, {}));
      expect(result.current.shortcuts['file.new']).toBe('Ctrl+N');
      expect(result.current.shortcuts['file.save']).toBe('Ctrl+S');
    });

    it('user overrides take precedence over defaults', () => {
      const ctx = makeMockContext();
      const commands = makeMockCommands(ctx);
      const { result } = renderHook(() =>
        useShortcuts(commands, ctx, { 'file.save': 'Ctrl+Shift+S' })
      );
      expect(result.current.shortcuts['file.save']).toBe('Ctrl+Shift+S');
    });

    it('empty string override removes the shortcut', () => {
      const ctx = makeMockContext();
      const commands = makeMockCommands(ctx);
      const { result } = renderHook(() =>
        useShortcuts(commands, ctx, { 'file.save': '' })
      );
      expect(result.current.shortcuts['file.save']).toBeUndefined();
    });

    it('handleKeyDown returns true and calls action for matching shortcut', () => {
      const ctx = makeMockContext();
      const commands = makeMockCommands(ctx);
      const { result } = renderHook(() => useShortcuts(commands, ctx, {}));

      const event = new KeyboardEvent('keydown', {
        key: 's',
        ctrlKey: true,
        bubbles: true,
      });
      const spy = vi.spyOn(event, 'preventDefault');

      let handled = false;
      act(() => {
        handled = result.current.handleKeyDown(event);
      });

      expect(handled).toBe(true);
      expect(spy).toHaveBeenCalled();
      expect(ctx.saveFile).toHaveBeenCalled();
    });

    it('handleKeyDown returns false for unmatched shortcut', () => {
      const ctx = makeMockContext();
      const commands = makeMockCommands(ctx);
      const { result } = renderHook(() => useShortcuts(commands, ctx, {}));

      const event = new KeyboardEvent('keydown', {
        key: 'x',
        ctrlKey: true,
      });

      let handled = true;
      act(() => {
        handled = result.current.handleKeyDown(event);
      });

      expect(handled).toBe(false);
    });

    it('handleKeyDown uses custom shortcut override', () => {
      const ctx = makeMockContext();
      const commands = makeMockCommands(ctx);
      const { result } = renderHook(() =>
        useShortcuts(commands, ctx, { 'file.save': 'Ctrl+Q' })
      );

      const oldEvent = new KeyboardEvent('keydown', { key: 's', ctrlKey: true });
      let handled: boolean = false;
      act(() => { handled = result.current.handleKeyDown(oldEvent); });
      expect(handled).toBe(false);
      expect(ctx.saveFile).not.toHaveBeenCalled();

      const newEvent = new KeyboardEvent('keydown', { key: 'q', ctrlKey: true });
      act(() => { handled = result.current.handleKeyDown(newEvent); });
      expect(handled).toBe(true);
      expect(ctx.saveFile).toHaveBeenCalled();
    });
  });

  describe('DEFAULT_SHORTCUTS', () => {
    it('includes all expected default shortcuts', () => {
      expect(DEFAULT_SHORTCUTS['file.new']).toBe('Ctrl+N');
      expect(DEFAULT_SHORTCUTS['file.open']).toBe('Ctrl+O');
      expect(DEFAULT_SHORTCUTS['file.save']).toBe('Ctrl+S');
      expect(DEFAULT_SHORTCUTS['view.commandPalette']).toBe('Ctrl+Shift+P');
    });

    it('has no duplicate combos in defaults', () => {
      const combos = Object.values(DEFAULT_SHORTCUTS);
      expect(new Set(combos).size).toBe(combos.length);
    });
  });
});
