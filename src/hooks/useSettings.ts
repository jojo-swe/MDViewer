import { useState, useCallback, useEffect, useRef } from 'react';
import type { AppSettings, Theme, EditorMode, RecentFile } from '../types/settings';
import type { StrictnessLevel } from '../types/lint';

const STORAGE_KEY = 'mdviewer-settings';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  editorMode: 'wysiwyg',
  lint: {
    enabled: true,
    strictness: 'standard',
  },
  autoSave: {
    enabled: false,
    interval: 5000,
  },
  wordWrap: false,
  syncScroll: true,
  fontSize: 14,
  recentFiles: [],
  customShortcuts: {},
};

/**
 * Migrate old scattered localStorage keys into the unified AppSettings object.
 * Runs once on first load when the unified settings don't exist yet.
 */
function migrateOldSettings(): Partial<AppSettings> | null {
  const hasUnified = localStorage.getItem(STORAGE_KEY);
  if (hasUnified) return null; // Already migrated

  const migrated: Partial<AppSettings> = {};

  // Theme
  const oldTheme = localStorage.getItem('mdviewer-theme');
  if (oldTheme === 'dark' || oldTheme === 'light') {
    migrated.theme = oldTheme;
  }

  // Editor mode
  const oldMode = localStorage.getItem('mdviewer-editor-mode');
  if (oldMode === 'wysiwyg' || oldMode === 'source' || oldMode === 'split') {
    migrated.editorMode = oldMode;
  }

  // Lint enabled
  const oldLintEnabled = localStorage.getItem('mdviewer-lint-enabled');
  if (oldLintEnabled !== null) {
    migrated.lint = {
      ...DEFAULT_SETTINGS.lint,
      enabled: oldLintEnabled === 'true',
    };
  }

  // Lint strictness
  const oldStrictness = localStorage.getItem('mdviewer-lint-strictness');
  if (oldStrictness === 'relaxed' || oldStrictness === 'standard' || oldStrictness === 'strict') {
    migrated.lint = {
      ...(migrated.lint || DEFAULT_SETTINGS.lint),
      strictness: oldStrictness,
    };
  }

  // Recent files
  const oldRecent = localStorage.getItem('mdviewer-recent-files');
  if (oldRecent) {
    try {
      migrated.recentFiles = JSON.parse(oldRecent) as RecentFile[];
    } catch {
      // Ignore parse errors
    }
  }

  return Object.keys(migrated).length > 0 ? migrated : null;
}

/**
 * Load settings from storage, falling back to defaults.
 * Tries Tauri Store first, then localStorage.
 */
async function loadSettings(): Promise<AppSettings> {
  // Try to migrate old settings first
  const migrated = migrateOldSettings();

  // Try Tauri Store
  try {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load(STORAGE_KEY + '.json');
    const stored = await store.get<AppSettings>(STORAGE_KEY);
    if (stored) {
      const merged = { ...DEFAULT_SETTINGS, ...stored, ...migrated };
      return merged;
    }
  } catch {
    // Not in Tauri environment, fall through to localStorage
  }

  // localStorage fallback
  if (migrated) {
    const merged = { ...DEFAULT_SETTINGS, ...migrated };
    return merged;
  }

  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as Partial<AppSettings>;
      return { ...DEFAULT_SETTINGS, ...parsed };
    }
  } catch {
    // Ignore parse errors
  }

  return { ...DEFAULT_SETTINGS };
}

/**
 * Save settings to storage (Tauri Store or localStorage).
 */
async function persistSettings(settings: AppSettings): Promise<void> {
  // Always save to localStorage for instant access
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch {
    // Ignore storage errors
  }

  // Also try Tauri Store
  try {
    const { load } = await import('@tauri-apps/plugin-store');
    const store = await load(STORAGE_KEY + '.json');
    await store.set(STORAGE_KEY, settings);
    await store.save();
  } catch {
    // Not in Tauri environment, localStorage is sufficient
  }
}

/**
 * Deep-merge a partial update into the current settings.
 */
function deepMergeSettings(base: AppSettings, update: Partial<AppSettings>): AppSettings {
  return {
    ...base,
    ...update,
    lint: update.lint ? { ...base.lint, ...update.lint } : base.lint,
    autoSave: update.autoSave ? { ...base.autoSave, ...update.autoSave } : base.autoSave,
  };
}

/**
 * Centralized settings store.
 * Replaces all scattered localStorage keys with a single AppSettings object.
 * Persists via Tauri Store when available, localStorage as fallback.
 * Migrates existing localStorage keys on first load.
 */
export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>(() => {
    // Synchronous initial load from localStorage for instant render
    try {
      const migrated = migrateOldSettings();
      if (migrated) {
        return { ...DEFAULT_SETTINGS, ...migrated };
      }
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw) as Partial<AppSettings>;
        return { ...DEFAULT_SETTINGS, ...parsed };
      }
    } catch {
      // Ignore
    }
    return { ...DEFAULT_SETTINGS };
  });
  const loadedRef = useRef(false);

  // Async load from Tauri Store on mount (may have more recent data)
  useEffect(() => {
    let cancelled = false;
    loadSettings().then((loaded) => {
      if (cancelled || loadedRef.current) return;
      loadedRef.current = true;
      setSettings(loaded);
    });
    return () => { cancelled = true; };
  }, []);

  // Persist on change
  useEffect(() => {
    persistSettings(settings);
  }, [settings]);

  // Apply theme to DOM
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', settings.theme);
  }, [settings.theme]);

  const updateSetting = useCallback(<K extends keyof AppSettings>(
    key: K,
    value: AppSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }, []);

  const updateSettings = useCallback((update: Partial<AppSettings>) => {
    setSettings((prev) => deepMergeSettings(prev, update));
  }, []);

  const updateLintSetting = useCallback(<K extends keyof AppSettings['lint']>(
    key: K,
    value: AppSettings['lint'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      lint: { ...prev.lint, [key]: value },
    }));
  }, []);

  const updateAutoSaveSetting = useCallback(<K extends keyof AppSettings['autoSave']>(
    key: K,
    value: AppSettings['autoSave'][K]
  ) => {
    setSettings((prev) => ({
      ...prev,
      autoSave: { ...prev.autoSave, [key]: value },
    }));
  }, []);

  const resetSettings = useCallback(() => {
    setSettings({ ...DEFAULT_SETTINGS });
  }, []);

  // Convenience setters
  const setTheme = useCallback((theme: Theme) => updateSetting('theme', theme), [updateSetting]);
  const setEditorMode = useCallback((mode: EditorMode) => updateSetting('editorMode', mode), [updateSetting]);
  const setStrictness = useCallback((level: StrictnessLevel) => updateLintSetting('strictness', level), [updateLintSetting]);
  const setLintEnabled = useCallback((enabled: boolean) => updateLintSetting('enabled', enabled), [updateLintSetting]);
  const toggleTheme = useCallback(() => {
    setSettings((prev) => ({ ...prev, theme: prev.theme === 'dark' ? 'light' : 'dark' }));
  }, []);
  const toggleLint = useCallback(() => {
    setSettings((prev) => ({ ...prev, lint: { ...prev.lint, enabled: !prev.lint.enabled } }));
  }, []);

  return {
    settings,
    updateSetting,
    updateSettings,
    updateLintSetting,
    updateAutoSaveSetting,
    resetSettings,
    // Convenience
    setTheme,
    setEditorMode,
    setStrictness,
    setLintEnabled,
    toggleTheme,
    toggleLint,
  };
}
