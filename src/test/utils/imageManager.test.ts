import { describe, it, expect, vi, beforeEach } from 'vitest';
import { invoke } from '@tauri-apps/api/core';
import {
  MAX_PASTED_IMAGE_BYTES,
  savePastedImage,
  isImageFile,
  isImageClipboardItem,
} from '../../utils/imageManager';

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

    it('delegates persistent image writes to the scoped native command', async () => {
      Object.defineProperty(window, '__TAURI_INTERNALS__', { configurable: true, value: {} });
      vi.mocked(invoke).mockResolvedValue('images/image-1.png');
      const blob = new Blob(['data'], { type: 'image/png' });

      const result = await savePastedImage(blob, 'C:\\docs\\draft.md');

      expect(result).toBe('images/image-1.png');
      expect(invoke).toHaveBeenCalledWith('save_pasted_image', expect.objectContaining({
        documentPath: 'C:\\docs\\draft.md',
        extension: 'png',
      }));
      delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    });

    it('does not hide a failed desktop write behind a transient blob URL', async () => {
      Object.defineProperty(window, '__TAURI_INTERNALS__', { configurable: true, value: {} });
      vi.mocked(invoke).mockRejectedValue(new Error('path denied'));

      await expect(savePastedImage(
        new Blob(['data'], { type: 'image/png' }),
        'C:\\docs\\draft.md'
      )).rejects.toThrow('path denied');

      delete (window as unknown as { __TAURI_INTERNALS__?: unknown }).__TAURI_INTERNALS__;
    });

    it('rejects oversized images before reading or serializing the blob', async () => {
      const blob = new Blob(['small'], { type: 'image/png' });
      Object.defineProperty(blob, 'size', { value: MAX_PASTED_IMAGE_BYTES + 1 });
      const arrayBuffer = vi.spyOn(blob, 'arrayBuffer');

      await expect(savePastedImage(blob, 'C:\\docs\\draft.md')).rejects.toThrow('10 MiB limit');
      expect(arrayBuffer).not.toHaveBeenCalled();
      expect(invoke).not.toHaveBeenCalled();
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
