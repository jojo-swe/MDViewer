import { describe, it, expect, beforeEach } from 'vitest';
import { applyTheme, builtinThemes, getThemeConfig, themeList } from '../../themes';

describe('themes', () => {
  beforeEach(() => {
    const root = document.documentElement;
    root.style.cssText = '';
    delete root.dataset.theme;
    delete root.dataset.themeName;
  });

  describe('builtinThemes', () => {
    it('includes light and dark themes', () => {
      expect(builtinThemes.light).toBeDefined();
      expect(builtinThemes.dark).toBeDefined();
    });

    it('includes github-dark and solarized variants', () => {
      expect(builtinThemes['github-dark']).toBeDefined();
      expect(builtinThemes['solarized-dark']).toBeDefined();
      expect(builtinThemes['solarized-light']).toBeDefined();
    });

    it('each theme has required color keys', () => {
      const requiredKeys = ['--bg-app', '--bg-sidebar', '--bg-editor', '--text-primary', '--accent-primary'];
      for (const theme of themeList) {
        for (const key of requiredKeys) {
          expect(theme.colors[key]).toBeDefined();
        }
      }
    });

    it('each theme has name, label, and isDark', () => {
      for (const theme of themeList) {
        expect(theme.name).toBeTruthy();
        expect(theme.label).toBeTruthy();
        expect(typeof theme.isDark).toBe('boolean');
      }
    });
  });

  describe('applyTheme', () => {
    it('sets CSS variables on document root', () => {
      applyTheme('dark');
      const root = document.documentElement;
      expect(root.style.getPropertyValue('--bg-app')).toBe(builtinThemes.dark.colors['--bg-app']);
      expect(root.style.getPropertyValue('--text-primary')).toBe(builtinThemes.dark.colors['--text-primary']);
    });

    it('sets data-theme attribute based on isDark', () => {
      applyTheme('light');
      expect(document.documentElement.dataset.theme).toBe('light');

      applyTheme('dark');
      expect(document.documentElement.dataset.theme).toBe('dark');
    });

    it('sets data-theme-name attribute to theme name', () => {
      applyTheme('github-dark');
      expect(document.documentElement.dataset.themeName).toBe('github-dark');
    });

    it('switching themes updates all variables', () => {
      applyTheme('light');
      const lightBg = document.documentElement.style.getPropertyValue('--bg-app');

      applyTheme('dark');
      const darkBg = document.documentElement.style.getPropertyValue('--bg-app');

      expect(lightBg).toBe(builtinThemes.light.colors['--bg-app']);
      expect(darkBg).toBe(builtinThemes.dark.colors['--bg-app']);
      expect(lightBg).not.toBe(darkBg);
    });

    it('falls back to dark theme for invalid theme name', () => {
      applyTheme('nonexistent-theme');
      expect(document.documentElement.dataset.themeName).toBe('dark');
      expect(document.documentElement.style.getPropertyValue('--bg-app')).toBe(builtinThemes.dark.colors['--bg-app']);
    });
  });

  describe('getThemeConfig', () => {
    it('returns config for valid theme name', () => {
      const config = getThemeConfig('light');
      expect(config.name).toBe('light');
      expect(config.isDark).toBe(false);
    });

    it('falls back to dark for invalid theme name', () => {
      const config = getThemeConfig('invalid');
      expect(config.name).toBe('dark');
    });
  });

  describe('themeList', () => {
    it('contains at least 5 themes', () => {
      expect(themeList.length).toBeGreaterThanOrEqual(5);
    });

    it('has unique names', () => {
      const names = themeList.map((t) => t.name);
      expect(new Set(names).size).toBe(names.length);
    });
  });
});
