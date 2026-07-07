import type { StrictnessLevel } from './lint';

export type Theme = 'dark' | 'light';

export type EditorMode = 'wysiwyg' | 'source' | 'split';

export interface RecentFile {
  path: string;
  filename: string;
  openedAt: number;
}

export interface AppSettings {
  theme: Theme;
  editorMode: EditorMode;
  lint: {
    enabled: boolean;
    strictness: StrictnessLevel;
  };
  autoSave: {
    enabled: boolean;
    interval: number;
  };
  wordWrap: boolean;
  syncScroll: boolean;
  fontSize: number;
  recentFiles: RecentFile[];
  customShortcuts: Record<string, string>;
}
