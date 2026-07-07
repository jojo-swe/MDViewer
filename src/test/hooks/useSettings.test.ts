import { describe, it, expect } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSettings } from '../../hooks/useSettings';

describe('useSettings', () => {
  it('returns default settings on first load', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.editorMode).toBe('wysiwyg');
    expect(result.current.settings.lint.enabled).toBe(true);
    expect(result.current.settings.lint.strictness).toBe('standard');
    expect(result.current.settings.wordWrap).toBe(false);
    expect(result.current.settings.syncScroll).toBe(true);
    expect(result.current.settings.fontSize).toBe(14);
    expect(result.current.settings.autoSave.enabled).toBe(false);
    expect(result.current.settings.recentFiles).toEqual([]);
  });

  it('toggles theme', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.settings.theme).toBe('light');
    act(() => {
      result.current.toggleTheme();
    });
    expect(result.current.settings.theme).toBe('dark');
  });

  it('toggles lint', () => {
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.lint.enabled).toBe(true);
    act(() => {
      result.current.toggleLint();
    });
    expect(result.current.settings.lint.enabled).toBe(false);
  });

  it('sets editor mode', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.setEditorMode('source');
    });
    expect(result.current.settings.editorMode).toBe('source');
  });

  it('sets strictness', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.setStrictness('strict');
    });
    expect(result.current.settings.lint.strictness).toBe('strict');
  });

  it('updates settings via updateSettings', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ wordWrap: true, fontSize: 18 });
    });
    expect(result.current.settings.wordWrap).toBe(true);
    expect(result.current.settings.fontSize).toBe(18);
  });

  it('deep-merges nested lint settings', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ lint: { strictness: 'strict' } } as never);
    });
    expect(result.current.settings.lint.strictness).toBe('strict');
    expect(result.current.settings.lint.enabled).toBe(true);
  });

  it('deep-merges nested autoSave settings', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ autoSave: { enabled: true } } as never);
    });
    expect(result.current.settings.autoSave.enabled).toBe(true);
    expect(result.current.settings.autoSave.interval).toBe(5000);
  });

  it('resets settings to defaults', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ theme: 'light', fontSize: 20, wordWrap: true });
    });
    act(() => {
      result.current.resetSettings();
    });
    expect(result.current.settings.theme).toBe('dark');
    expect(result.current.settings.fontSize).toBe(14);
    expect(result.current.settings.wordWrap).toBe(false);
  });

  it('migrates old localStorage keys', () => {
    localStorage.setItem('mdviewer-theme', 'light');
    localStorage.setItem('mdviewer-editor-mode', 'source');
    localStorage.setItem('mdviewer-lint-enabled', 'false');
    localStorage.setItem('mdviewer-lint-strictness', 'strict');
    const { result } = renderHook(() => useSettings());
    expect(result.current.settings.theme).toBe('light');
    expect(result.current.settings.editorMode).toBe('source');
    expect(result.current.settings.lint.enabled).toBe(false);
    expect(result.current.settings.lint.strictness).toBe('strict');
  });

  it('persists settings to localStorage', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.updateSettings({ theme: 'light' });
    });
    const stored = JSON.parse(localStorage.getItem('mdviewer-settings') || '{}');
    expect(stored.theme).toBe('light');
  });

  it('applies theme to document element', () => {
    const { result } = renderHook(() => useSettings());
    act(() => {
      result.current.setTheme('light');
    });
    expect(document.documentElement.getAttribute('data-theme')).toBe('light');
  });
});
