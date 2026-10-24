export type SaveOutcome =
  | { status: 'saved'; path: string; content: string }
  | { status: 'cancelled' }
  | { status: 'conflict'; reason: 'changed' | 'deleted'; diskContent?: string }
  | { status: 'failed'; error: Error };

export interface SaveDocumentOptions {
  forceSaveAs?: boolean;
}
