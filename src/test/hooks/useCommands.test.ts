import { describe, it, expect, vi } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useCommands } from '../../hooks/useCommands';
import type { CommandContext } from '../../types/command';

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

describe('useCommands', () => {
  it('returns a non-empty array of commands', () => {
    const ctx = makeMockContext();
    const { result } = renderHook(() => useCommands(ctx));
    expect(result.current.length).toBeGreaterThan(10);
  });

  it('includes file commands', () => {
    const ctx = makeMockContext();
    const { result } = renderHook(() => useCommands(ctx));
    const fileCmds = result.current.filter((c) => c.category === 'file');
    expect(fileCmds.length).toBeGreaterThanOrEqual(5);
    expect(fileCmds.some((c) => c.id === 'file.new')).toBe(true);
    expect(fileCmds.some((c) => c.id === 'file.open')).toBe(true);
    expect(fileCmds.some((c) => c.id === 'file.save')).toBe(true);
  });

  it('includes view commands', () => {
    const ctx = makeMockContext();
    const { result } = renderHook(() => useCommands(ctx));
    const viewCmds = result.current.filter((c) => c.category === 'view');
    expect(viewCmds.some((c) => c.id === 'view.toggleSidebar')).toBe(true);
    expect(viewCmds.some((c) => c.id === 'view.wysiwyg')).toBe(true);
    expect(viewCmds.some((c) => c.id === 'view.toggleWordWrap')).toBe(true);
    expect(viewCmds.some((c) => c.id === 'view.toggleOutline')).toBe(true);
    expect(viewCmds.some((c) => c.id === 'view.commandPalette')).toBe(true);
  });

  it('includes lint commands', () => {
    const ctx = makeMockContext();
    const { result } = renderHook(() => useCommands(ctx));
    const lintCmds = result.current.filter((c) => c.category === 'lint');
    expect(lintCmds.some((c) => c.id === 'lint.toggle')).toBe(true);
    expect(lintCmds.some((c) => c.id === 'lint.relaxed')).toBe(true);
    expect(lintCmds.some((c) => c.id === 'lint.strict')).toBe(true);
  });

  it('includes settings commands', () => {
    const ctx = makeMockContext();
    const { result } = renderHook(() => useCommands(ctx));
    const settingsCmds = result.current.filter((c) => c.category === 'settings');
    expect(settingsCmds.some((c) => c.id === 'settings.open')).toBe(true);
    expect(settingsCmds.some((c) => c.id === 'settings.reset')).toBe(true);
  });

  it('commands have required fields', () => {
    const ctx = makeMockContext();
    const { result } = renderHook(() => useCommands(ctx));
    for (const cmd of result.current) {
      expect(cmd.id).toBeDefined();
      expect(cmd.title).toBeDefined();
      expect(cmd.category).toBeDefined();
      expect(typeof cmd.action).toBe('function');
    }
  });

  it('executing a command calls the context function', () => {
    const ctx = makeMockContext();
    const { result } = renderHook(() => useCommands(ctx));
    const newCmd = result.current.find((c) => c.id === 'file.new');
    newCmd?.action(ctx);
    expect(ctx.newTab).toHaveBeenCalled();
  });
});
