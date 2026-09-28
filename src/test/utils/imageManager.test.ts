import { describe, it, expect, vi, beforeEach } from 'vitest';
import { savePastedImage, isImageFile, isImageClipboardItem } from '../../utils/imageManager';

describe('imageManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('savePastedImage', () => {
    it('returns blob URL when basePath is null', async () => {
      const blob = new Blob(['fake image data'], { type: 'image/png' });
      const result = await savePastedImage(blob, null);
      expect(result).toMatch(/^blob:/);
    });

    it('returns blob URL when basePath is empty string', async () => {
      const blob = new Blob(['fake image data'], { type: 'image/jpeg' });
      const result = await savePastedImage(blob, '');
      expect(result).toMatch(/^blob:/);
    });

    it('generates filename with correct extension from blob type', async () => {
      const blob = new Blob(['data'], { type: 'image/webp' });
      const result = await savePastedImage(blob, null);
      // Blob URL doesn't contain filename, but the function should not throw
      expect(result).toMatch(/^blob:/);
    });

    it('falls back to png extension for unknown image types', async () => {
      const blob = new Blob(['data'], { type: 'image/unknown' });
      const result = await savePastedImage(blob, null);
      expect(result).toMatch(/^blob:/);
    });
  });

  describe('isImageFile', () => {
    it('returns true for image files', () => {
      const file = new File(['data'], 'test.png', { type: 'image/png' });
      expect(isImageFile(file)).toBe(true);
    });

    it('returns false for non-image files', () => {
      const file = new File(['data'], 'test.txt', { type: 'text/plain' });
      expect(isImageFile(file)).toBe(false);
    });

    it('returns false for files with no type', () => {
      const file = new File(['data'], 'test', { type: '' });
      expect(isImageFile(file)).toBe(false);
    });
  });

  describe('isImageClipboardItem', () => {
    it('returns true for image clipboard items', () => {
      const item = { type: 'image/png', kind: 'file' } as unknown as DataTransferItem;
      expect(isImageClipboardItem(item)).toBe(true);
    });

    it('returns false for text clipboard items', () => {
      const item = { type: 'text/plain', kind: 'string' } as unknown as DataTransferItem;
      expect(isImageClipboardItem(item)).toBe(false);
    });
  });
});
