import {
  FilePlus,
  FolderOpen,
  Save,
  Save as SaveIcon,
  FileDown,
  X,
  Search,
  Replace,
  PanelLeft,
  Settings,
  Repeat,
  Eye,
  Code,
  Columns2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  RotateCcw,
} from 'lucide-react';
import type { Command } from '../types/command';
import type { CommandContext } from '../types/command';

export function createCommands(ctx: CommandContext): Command[] {
  return [
    // --- File ---
    {
      id: 'file.new',
      title: 'New Tab',
      shortcut: 'Ctrl+N',
      category: 'file',
      icon: FilePlus,
      action: () => ctx.newTab(),
    },
    {
      id: 'file.open',
      title: 'Open File',
      shortcut: 'Ctrl+O',
      category: 'file',
      icon: FolderOpen,
      action: () => ctx.openFile(),
    },
    {
      id: 'file.save',
      title: 'Save',
      shortcut: 'Ctrl+S',
      category: 'file',
      icon: Save,
      action: () => ctx.saveFile(),
    },
    {
      id: 'file.saveAs',
      title: 'Save As',
      shortcut: 'Ctrl+Shift+S',
      category: 'file',
      icon: SaveIcon,
      action: () => ctx.saveFileAs(),
    },
    {
      id: 'file.exportPDF',
      title: 'Export PDF',
      shortcut: 'Ctrl+Shift+E',
      category: 'file',
      icon: FileDown,
      action: () => ctx.exportPDF(),
    },
    {
      id: 'file.closeTab',
      title: 'Close Tab',
      shortcut: 'Ctrl+W',
      category: 'file',
      icon: X,
      action: () => ctx.closeTab(),
    },

    // --- Edit ---
    {
      id: 'edit.find',
      title: 'Find',
      shortcut: 'Ctrl+F',
      category: 'edit',
      icon: Search,
      action: () => ctx.toggleFind(),
    },
    {
      id: 'edit.replace',
      title: 'Find & Replace',
      shortcut: 'Ctrl+H',
      category: 'edit',
      icon: Replace,
      action: () => ctx.toggleFind(),
    },

    // --- View ---
    {
      id: 'view.toggleSidebar',
      title: 'Toggle Sidebar',
      shortcut: 'Ctrl+B',
      category: 'view',
      icon: PanelLeft,
      action: () => ctx.toggleSidebar(),
    },
    {
      id: 'view.toggleSettings',
      title: 'Toggle Settings',
      shortcut: 'Ctrl+,',
      category: 'view',
      icon: Settings,
      action: () => ctx.toggleSettings(),
    },
    {
      id: 'view.cycleTabs',
      title: 'Next Tab',
      shortcut: 'Ctrl+Tab',
      category: 'view',
      icon: Repeat,
      action: () => ctx.cycleTabs(1),
    },
    {
      id: 'view.cycleTabsPrev',
      title: 'Previous Tab',
      shortcut: 'Ctrl+Shift+Tab',
      category: 'view',
      icon: Repeat,
      action: () => ctx.cycleTabs(-1),
    },
    {
      id: 'view.wysiwyg',
      title: 'Switch to WYSIWYG Mode',
      shortcut: 'Ctrl+Alt+1',
      category: 'view',
      icon: Eye,
      action: () => ctx.setEditorMode('wysiwyg'),
    },
    {
      id: 'view.source',
      title: 'Switch to Source Mode',
      shortcut: 'Ctrl+Alt+2',
      category: 'view',
      icon: Code,
      action: () => ctx.setEditorMode('source'),
    },
    {
      id: 'view.split',
      title: 'Switch to Split Mode',
      shortcut: 'Ctrl+Alt+3',
      category: 'view',
      icon: Columns2,
      action: () => ctx.setEditorMode('split'),
    },

    // --- Lint ---
    {
      id: 'lint.toggle',
      title: 'Toggle Linting',
      category: 'lint',
      icon: Shield,
      action: () => ctx.toggleLint(),
    },
    {
      id: 'lint.relaxed',
      title: 'Set Lint Strictness: Relaxed',
      category: 'lint',
      icon: Shield,
      action: () => ctx.setStrictness('relaxed'),
    },
    {
      id: 'lint.standard',
      title: 'Set Lint Strictness: Standard',
      category: 'lint',
      icon: ShieldCheck,
      action: () => ctx.setStrictness('standard'),
    },
    {
      id: 'lint.strict',
      title: 'Set Lint Strictness: Strict',
      category: 'lint',
      icon: ShieldAlert,
      action: () => ctx.setStrictness('strict'),
    },

    // --- Settings ---
    {
      id: 'settings.open',
      title: 'Open Settings',
      shortcut: 'Ctrl+,',
      category: 'settings',
      icon: Settings,
      action: () => ctx.toggleSettings(),
    },
    {
      id: 'settings.reset',
      title: 'Reset Settings to Defaults',
      category: 'settings',
      icon: RotateCcw,
      action: () => ctx.resetSettings(),
    },
  ];
}
