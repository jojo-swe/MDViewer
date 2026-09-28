export interface Tab {
  id: number;
  path: string | null;
  filename: string;
  content: string;
  savedContent: string;
  isDirty: boolean;
}

export interface MakeTabOverrides {
  id?: number;
  path?: string | null;
  filename?: string;
  content?: string;
  savedContent?: string;
  isDirty?: boolean;
}
