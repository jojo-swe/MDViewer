/**
 * File management utilities for Tauri.
 * Wraps the Tauri file dialog and filesystem APIs.
 * Falls back gracefully when running in a normal browser (dev mode without Tauri).
 */

let tauriDialog = null;
let tauriFs = null;

// Dynamically import Tauri modules (only available in the desktop app)
async function ensureTauri() {
  if (tauriDialog && tauriFs) return true;
  try {
    tauriDialog = await import('@tauri-apps/plugin-dialog');
    tauriFs = await import('@tauri-apps/plugin-fs');
    return true;
  } catch {
    return false;
  }
}

/**
 * Open a markdown file via native dialog.
 * @returns {{ path: string, content: string } | null}
 */
export async function openFile() {
  const hasTauri = await ensureTauri();

  if (hasTauri) {
    const filePath = await tauriDialog.open({
      title: 'Open Markdown File',
      filters: [
        { name: 'Markdown', extensions: ['md', 'markdown', 'mdown', 'mkd', 'mdx'] },
        { name: 'Text', extensions: ['txt'] },
        { name: 'All Files', extensions: ['*'] },
      ],
      multiple: false,
    });

    if (!filePath) return null;

    const content = await tauriFs.readTextFile(filePath);
    return { path: filePath, content };
  }

  // Web fallback: use the File System Access API or <input>
  return new Promise((resolve) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.md,.markdown,.mdown,.mkd,.mdx,.txt';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (!file) return resolve(null);
      const content = await file.text();
      resolve({ path: file.name, content });
    };
    input.click();
  });
}

/**
 * Save content to a specific file path.
 * @param {string} path - The file path to save to
 * @param {string} content - The markdown content
 */
export async function saveFile(path, content) {
  const hasTauri = await ensureTauri();

  if (hasTauri && path) {
    await tauriFs.writeTextFile(path, content);
    return path;
  }

  // Web fallback: trigger download
  return saveFileAs(content);
}

/**
 * Save content with a "Save As" dialog.
 * @param {string} content - The markdown content
 * @returns {string | null} The saved file path, or null if cancelled
 */
export async function saveFileAs(content) {
  const hasTauri = await ensureTauri();

  if (hasTauri) {
    const filePath = await tauriDialog.save({
      title: 'Save Markdown File',
      defaultPath: 'untitled.md',
      filters: [
        { name: 'Markdown', extensions: ['md'] },
        { name: 'All Files', extensions: ['*'] },
      ],
    });

    if (!filePath) return null;

    await tauriFs.writeTextFile(filePath, content);
    return filePath;
  }

  // Web fallback: download
  const blob = new Blob([content], { type: 'text/markdown' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'untitled.md';
  a.click();
  URL.revokeObjectURL(url);
  return 'untitled.md';
}

/**
 * Extract the file name from a full path.
 * @param {string} path
 * @returns {string}
 */
export function getFileName(path) {
  if (!path) return 'Untitled';
  return path.split(/[\\/]/).pop() || 'Untitled';
}

/**
 * Check if we're running inside Tauri.
 */
export function isDesktopApp() {
  return typeof window !== 'undefined' && window.__TAURI_INTERNALS__;
}
