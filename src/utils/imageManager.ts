import { isDesktopApp } from './fileManager';

const IMAGE_EXTENSION_BY_MIME: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
  'image/bmp': 'bmp',
};

export const MAX_PASTED_IMAGE_BYTES = 10 * 1024 * 1024;

export async function savePastedImage(
  blob: Blob,
  documentPath: string | null
): Promise<string> {
  const extension = IMAGE_EXTENSION_BY_MIME[blob.type] || 'png';

  if (blob.size > MAX_PASTED_IMAGE_BYTES) {
    throw new Error('The pasted image exceeds the 10 MiB limit');
  }

  if (documentPath && isDesktopApp()) {
    try {
      const { invoke } = await import('@tauri-apps/api/core');
      return await invoke<string>('save_pasted_image', {
        documentPath,
        bytes: Array.from(new Uint8Array(await blob.arrayBuffer())),
        extension,
      });
    } catch (error) {
      throw new Error(`Could not save pasted image: ${(error as Error).message}`);
    }
  }

  return URL.createObjectURL(blob);
}

export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

export function isImageClipboardItem(item: DataTransferItem): boolean {
  return item.type.startsWith('image/');
}
