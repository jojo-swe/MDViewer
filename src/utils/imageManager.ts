export async function savePastedImage(
  blob: Blob,
  basePath: string | null
): Promise<string> {
  const ext = blob.type.split('/')[1] || 'png';
  const filename = `image-${Date.now()}.${ext}`;

  if (basePath) {
    try {
      const { mkdir, writeFile } = await import('@tauri-apps/plugin-fs');
      const { join } = await import('@tauri-apps/api/path');
      const imagesDir = await join(basePath, 'images');
      await mkdir(imagesDir, { recursive: true });
      const fullPath = await join(imagesDir, filename);
      await writeFile(fullPath, new Uint8Array(await blob.arrayBuffer()));
      return `images/${filename}`;
    } catch {
      // Fall through to blob URL
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
