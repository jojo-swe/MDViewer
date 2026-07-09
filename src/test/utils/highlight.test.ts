import { describe, it, expect, vi, beforeEach } from 'vitest';

vi.mock('shiki', () => {
  const mockCodeToHtml = vi.fn((code: string, opts: { lang: string; theme: string }) => {
    return `<pre class="shiki ${opts.theme}" tabindex="0"><code><span class="line">${code}</span></code></pre>`;
  });

  const mockHighlighter = {
    codeToHtml: mockCodeToHtml,
  };

  return {
    getSingletonHighlighter: vi.fn().mockResolvedValue(mockHighlighter),
  };
});

import { highlightCode, isSupportedLang, getHighlighterInstance } from '../../utils/highlight';

describe('highlight', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('isSupportedLang', () => {
    it('returns true for supported languages', () => {
      expect(isSupportedLang('javascript')).toBe(true);
      expect(isSupportedLang('typescript')).toBe(true);
      expect(isSupportedLang('python')).toBe(true);
      expect(isSupportedLang('rust')).toBe(true);
      expect(isSupportedLang('json')).toBe(true);
    });

    it('returns false for unsupported languages', () => {
      expect(isSupportedLang('brainfuck')).toBe(false);
      expect(isSupportedLang('cobol')).toBe(false);
      expect(isSupportedLang('')).toBe(false);
    });
  });

  describe('highlightCode', () => {
    it('returns highlighted HTML string with shiki class', async () => {
      const result = await highlightCode('const x = 1;', 'javascript', 'dark');
      expect(result).toContain('shiki');
      expect(result).toContain('const x = 1;');
    });

    it('falls back to markdown for unknown languages', async () => {
      const result = await highlightCode('# Hello', 'brainfuck', 'dark');
      expect(result).toContain('shiki');
      expect(result).toContain('# Hello');
    });

    it('uses light theme when theme is light', async () => {
      const result = await highlightCode('const x = 1;', 'javascript', 'light');
      expect(result).toContain('github-light');
    });

    it('uses dark theme when theme is dark', async () => {
      const result = await highlightCode('const x = 1;', 'javascript', 'dark');
      expect(result).toContain('one-dark-pro');
    });
  });

  describe('getHighlighterInstance', () => {
    it('returns a highlighter instance', async () => {
      const h = await getHighlighterInstance();
      expect(h).toBeDefined();
      expect(h.codeToHtml).toBeDefined();
    });
  });
});
