import { describe, it, expect } from 'vitest';
import { getFileName, isDesktopApp, openFile, saveFile, saveFileAs } from '../../utils/fileManager';

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

  describe('isDesktopApp', () => {
    it('returns false in test environment', () => {
      expect(isDesktopApp()).toBe(false);
    });
  });

  describe('openFile', () => {
    it('returns null when dialog returns null', async () => {
      const result = await openFile();
      expect(result).toBeNull();
    });
  });

  describe('saveFile', () => {
    it('returns null when no path provided (delegates to saveFileAs)', async () => {
      const result = await saveFile(null, 'content');
      expect(result).toBeNull();
    });
  });

  describe('saveFileAs', () => {
    it('returns null when dialog returns null', async () => {
      const result = await saveFileAs('content');
      expect(result).toBeNull();
    });
  });
});
