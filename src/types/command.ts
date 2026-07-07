import type { LucideIcon } from 'lucide-react';

export type CommandCategory = 'file' | 'edit' | 'view' | 'lint' | 'settings';

export interface CommandContext {
  openFile: () => void;
  saveFile: () => void;
  saveFileAs: () => void;
  newTab: () => void;
  closeTab: () => void;
  exportPDF: () => void;
  toggleSidebar: () => void;
  toggleFind: () => void;
  toggleSettings: () => void;
  cycleTabs: (direction: number) => void;
  setEditorMode: (mode: import('./settings').EditorMode) => void;
  toggleLint: () => void;
  setStrictness: (level: import('./lint').StrictnessLevel) => void;
  resetSettings: () => void;
}

export interface Command {
  id: string;
  title: string;
  shortcut?: string;
  category: CommandCategory;
  icon?: LucideIcon;
  action: (ctx: CommandContext) => void | Promise<void>;
}
