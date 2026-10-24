import type { Tab } from '../types/tab';
import type { SaveDocumentOptions, SaveOutcome } from '../types/document';
import type { ExistingFileWriteResult } from '../types/file';
import { saveFile, saveFileAs } from './fileManager';

export interface DocumentPersistence {
  save: (path: string, content: string, expectedContent: string) => Promise<ExistingFileWriteResult>;
  saveAs: (content: string) => Promise<string | null>;
}

const defaultPersistence: DocumentPersistence = {
  save: (path, content, expectedContent) => saveFile(path, content, expectedContent),
  saveAs: (content) => saveFileAs(content),
};

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error(String(error));
}

/**
 * Saves a stable tab/content snapshot and reports cancellation separately from
 * failure. Callers decide whether a successful save is allowed to close a tab.
 */
export async function saveDocument(
  tab: Tab,
  content: string,
  options: SaveDocumentOptions = {},
  persistence: DocumentPersistence = defaultPersistence
): Promise<SaveOutcome> {
  try {
    if (tab.path && !options.forceSaveAs) {
      const result = await persistence.save(tab.path, content, tab.savedContent);
      if (result.status === 'conflict') return result;
      return { status: 'saved', path: result.path, content };
    }

    const path = await persistence.saveAs(content);

    if (!path) return { status: 'cancelled' };
    return { status: 'saved', path, content };
  } catch (error) {
    return { status: 'failed', error: toError(error) };
  }
}
