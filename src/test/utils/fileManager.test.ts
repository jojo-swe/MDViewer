import { describe, it, expect, vi } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  getFileName,
  isDesktopApp,
  MAX_DOCUMENT_BYTES,
  openFile,
  readBrowserTextFile,
  readTextFile,
  saveFile,
  saveFileAs,
} from '../../utils/fileManager';

function mockBrowserDownload() {
  Object.defineProperty(URL, 'createObjectURL', {
    configurable: true,
    value: vi.fn().mockReturnValue('blob:test'),
  });
  Object.defineProperty(URL, 'revokeObjectURL', {
    configurable: true,
    value: vi.fn(),
  });
}

describe('fileManager', () => {
  describe('getFileName', () => {
    it('extracts filename from unix path', () => {
      expect(getFileName('/home/user/docs/readme.md')).toBe('readme.md');
    });

    it('extracts filename from windows path', () => {
      expect(getFileName('C:\\Users\\docs\\readme.md')).toBe('readme.md');
    });

    it('extracts filename from bare filename', () => {
      expect(getFileName('readme.md')).toBe('readme.md');
    });

    it('returns Untitled for null/undefined path', () => {
      expect(getFileName(null)).toBe('Untitled');
      expect(getFileName(undefined)).toBe('Untitled');
    });

    it('handles paths with no extension', () => {
      expect(getFileName('/home/user/README')).toBe('README');
    });

    it('handles paths with multiple dots', () => {
      expect(getFileName('/path/to/file.test.md')).toBe('file.test.md');
    });
  });

  describe('readBrowserTextFile', () => {
    it('rejects files above the supported document limit before reading', async () => {
      const file = new File(['small'], 'huge.md', { type: 'text/markdown' });
      Object.defineProperty(file, 'size', { value: MAX_DOCUMENT_BYTES + 1 });
      const text = vi.spyOn(file, 'text');

      await expect(readBrowserTextFile(file)).rejects.toThrow('5 MiB document limit');
      expect(text).not.toHaveBeenCalled();
    });
  });

  describe('isDesktopApp', () => {
    it('returns false in test environment', () => {
      expect(isDesktopApp()).toBe(false);
    });
  });

  describe('openFile', () => {
    it('returns null when dialog returns null', async () => {
      const createElement = document.createElement.bind(document);
      vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
        const element = createElement(tagName, options);
        if (tagName === 'input') {
          vi.spyOn(element, 'click').mockImplementation(() => {
            element.dispatchEvent(new Event('change'));
          });
        }
        return element;
      });
      const result = await openFile();
      expect(result).toBeNull();
    });

    it('rejects an oversized browser selection instead of leaving the open pending', async () => {
      const createElement = document.createElement.bind(document);
      const file = new File(['small'], 'huge.md', { type: 'text/markdown' });
      Object.defineProperty(file, 'size', { value: MAX_DOCUMENT_BYTES + 1 });
      vi.spyOn(document, 'createElement').mockImplementation((tagName, options) => {
        const element = createElement(tagName, options);
        if (tagName === 'input') {
          Object.defineProperty(element, 'files', { configurable: true, value: [file] });
          vi.spyOn(element, 'click').mockImplementation(() => {
            element.dispatchEvent(new Event('change'));
          });
        }
        return element;
      });

      await expect(openFile()).rejects.toThrow('5 MiB document limit');
    });

    it('uses the bounded native read command in the desktop app', async () => {
      Object.defineProperty(window, '__TAURI_INTERNALS__', { configurable: true, value: {} });
      vi.mocked(invoke).mockResolvedValue('# native');

      await expect(readTextFile('C:\\docs\\test.md')).resolves.toBe('# native');
      expect(invoke).toHaveBeenCalledWith('read_bounded_text_file', {
        path: 'C:\\docs\\test.md',
      });
      delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    });
  });

  describe('saveFile', () => {
    it('uses a browser download when not running in Tauri', async () => {
      mockBrowserDownload();
      const result = await saveFile('uploaded.md', 'content', 'original');
      expect(result).toEqual({ status: 'saved', path: 'untitled.md' });
    });

    it('uses the protected Tauri command for an existing desktop file', async () => {
      Object.defineProperty(window, '__TAURI_INTERNALS__', { configurable: true, value: {} });
      vi.mocked(invoke).mockResolvedValue({ status: 'saved' });

      const result = await saveFile('C:\\docs\\test.md', 'content', 'original');

      expect(invoke).toHaveBeenCalledWith('atomic_write_text_file', {
        path: 'C:\\docs\\test.md',
        content: 'content',
        expectedContent: 'original',
      });
      expect(result).toEqual({ status: 'saved', path: 'C:\\docs\\test.md' });
      delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    });

    it('passes through external file conflicts from the protected writer', async () => {
      Object.defineProperty(window, '__TAURI_INTERNALS__', { configurable: true, value: {} });
      vi.mocked(invoke).mockResolvedValue({
        status: 'conflict',
        reason: 'changed',
        diskContent: 'external',
      });

      const result = await saveFile('C:\\docs\\test.md', 'mine', 'original');

      expect(result).toEqual({ status: 'conflict', reason: 'changed', diskContent: 'external' });
      delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    });
  });

  describe('saveFileAs', () => {
    it('downloads a new file in the browser', async () => {
      mockBrowserDownload();
      const result = await saveFileAs('content');
      expect(result).toBe('untitled.md');
    });
  });
});
