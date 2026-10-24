export interface OpenFileResult {
  path: string;
  content: string;
}

export type FileConflictReason = 'changed' | 'deleted';

export type ExistingFileWriteResult =
  | { status: 'saved'; path: string }
  | { status: 'conflict'; reason: FileConflictReason; diskContent?: string };
