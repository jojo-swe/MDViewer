import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from '../App';
import { saveDocument } from '../utils/documentManager';
import { SESSION_STORAGE_KEY } from '../utils/sessionManager';

const appMocks = vi.hoisted(() => ({
  settings: {
    theme: 'dark',
    editorMode: 'wysiwyg',
    lint: { enabled: true, strictness: 'standard' },
    autoSave: { enabled: false, interval: 100 },
    wordWrap: false,
    syncScroll: true,
    fontSize: 14,
    recentFiles: [],
    customShortcuts: {},
  },
  updateSettings: vi.fn(),
  resetSettings: vi.fn(),
  toggleTheme: vi.fn(),
  toggleLint: vi.fn(),
  setEditorMode: vi.fn(),
  setStrictness: vi.fn(),
}));

vi.mock('../hooks/useSettings', () => ({
  useSettings: () => ({
    settings: appMocks.settings,
    updateSettings: appMocks.updateSettings,
    resetSettings: appMocks.resetSettings,
    toggleTheme: appMocks.toggleTheme,
    toggleLint: appMocks.toggleLint,
    setEditorMode: appMocks.setEditorMode,
    setStrictness: appMocks.setStrictness,
  }),
}));

vi.mock('../utils/documentManager', () => ({ saveDocument: vi.fn() }));
vi.mock('../utils/fileManager', () => ({
  openFile: vi.fn().mockResolvedValue(null),
  saveFile: vi.fn(),
  saveFileAs: vi.fn(),
  getFileName: (path?: string | null) => path?.split(/[\\/]/).pop() || 'Untitled',
  isDesktopApp: () => false,
  readBrowserTextFile: (file: File) => file.text(),
  readTextFile: vi.fn(),
}));
vi.mock('../utils/pdfExport', () => ({ exportToPDF: vi.fn() }));

vi.mock('../components/MilkdownEditor', () => ({
  default: ({ externalContent = '', onMarkdownChange }: {
    externalContent?: string;
    onMarkdownChange?: (markdown: string) => void;
  }) => (
    <textarea
      aria-label="WYSIWYG editor"
      value={externalContent}
      onChange={(event) => onMarkdownChange?.(event.target.value)}
    />
  ),
}));

function createDirtyDocument(content: string) {
  fireEvent.click(screen.getByText('New Document'));
  fireEvent.change(screen.getByLabelText('WYSIWYG editor'), { target: { value: content } });
}

function closeActiveUntitledTab() {
  const closeButtons = screen.getAllByLabelText('Close Untitled');
  fireEvent.click(closeButtons[closeButtons.length - 1]);
}

describe('App document safety workflows', () => {
  beforeEach(() => {
    appMocks.settings.autoSave.enabled = false;
    vi.mocked(saveDocument).mockReset();
  });

  it('opens the editor from the welcome screen and tracks dirty content', () => {
    render(<App />);

    expect(screen.getByText('MDViewer')).toBeDefined();
    createDirtyDocument('# Draft');

    expect(screen.getByLabelText('WYSIWYG editor')).toHaveValue('# Draft');
    expect(document.querySelectorAll('.tab--dirty')).toHaveLength(1);
  });

  it('restores dirty work from an unclean session', async () => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      version: 1,
      updatedAt: Date.now(),
      cleanExit: false,
      incomplete: false,
      activeId: 900,
      tabs: [{
        id: 900,
        path: '/recovered.md',
        filename: 'recovered.md',
        content: 'recovered draft',
        savedContent: 'older disk content',
        isDirty: true,
      }],
    }));

    render(<App />);

    expect(screen.getByLabelText('WYSIWYG editor')).toHaveValue('recovered draft');
    expect(document.querySelectorAll('.tab--dirty')).toHaveLength(1);
    expect(await screen.findByText('Recovered unsaved work after an unclean shutdown.')).toBeDefined();
  });

  it('keeps a dirty tab open when Save As is cancelled during close', async () => {
    vi.mocked(saveDocument).mockResolvedValue({ status: 'cancelled' });
    render(<App />);
    createDirtyDocument('do not lose me');

    closeActiveUntitledTab();
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => expect(saveDocument).toHaveBeenCalled());
    expect(screen.getByRole('dialog', { name: 'Unsaved Changes' })).toBeDefined();
    expect(screen.getByLabelText('WYSIWYG editor')).toHaveValue('do not lose me');
    expect(document.querySelectorAll('.tab--dirty')).toHaveLength(1);
  });

  it('keeps a dirty tab open and reports an error when saving fails', async () => {
    vi.mocked(saveDocument).mockResolvedValue({ status: 'failed', error: new Error('disk full') });
    render(<App />);
    createDirtyDocument('important');

    closeActiveUntitledTab();
    fireEvent.click(screen.getByText('Save'));

    expect(await screen.findByText('Save failed: disk full')).toBeDefined();
    expect(screen.getByRole('dialog', { name: 'Unsaved Changes' })).toBeDefined();
    expect(document.querySelectorAll('.tab--dirty')).toHaveLength(1);
  });

  it('blocks close when the file changed outside MDViewer', async () => {
    vi.mocked(saveDocument).mockResolvedValue({
      status: 'conflict',
      reason: 'changed',
      diskContent: 'external version',
    });
    render(<App />);
    createDirtyDocument('my version');

    closeActiveUntitledTab();
    fireEvent.click(screen.getByText('Save'));

    expect(await screen.findByText(/changed outside MDViewer/)).toBeDefined();
    expect(screen.getByRole('dialog', { name: 'Unsaved Changes' })).toBeDefined();
    expect(screen.getByLabelText('WYSIWYG editor')).toHaveValue('my version');
    expect(document.querySelectorAll('.tab--dirty')).toHaveLength(1);
  });

  it('closes the tab only after a successful save', async () => {
    vi.mocked(saveDocument).mockResolvedValue({
      status: 'saved',
      path: 'C:\\docs\\saved.md',
      content: 'safe content',
    });
    render(<App />);
    createDirtyDocument('safe content');

    closeActiveUntitledTab();
    fireEvent.click(screen.getByText('Save'));

    await waitFor(() => {
      expect(screen.queryByRole('dialog', { name: 'Unsaved Changes' })).toBeNull();
    });
    expect(saveDocument).toHaveBeenCalledWith(
      expect.objectContaining({ content: 'safe content', isDirty: true }),
      'safe content',
      { forceSaveAs: undefined }
    );
    expect(document.querySelectorAll('.tab--dirty')).toHaveLength(0);
  });

  it('processes multiple dirty tabs through one ordered Close All queue', async () => {
    vi.mocked(saveDocument).mockResolvedValue({ status: 'cancelled' });
    render(<App />);
    createDirtyDocument('first dirty document');
    fireEvent.click(screen.getByTitle('New Tab'));
    fireEvent.change(screen.getByLabelText('WYSIWYG editor'), { target: { value: 'second dirty document' } });

    const tabs = screen.getAllByTitle('Untitled');
    fireEvent.contextMenu(tabs[tabs.length - 1]);
    fireEvent.click(screen.getByText('Close All'));

    expect(screen.getByText(/\(1 more\)$/)).toBeDefined();
    fireEvent.click(screen.getByText("Don't Save"));
    expect(screen.getByRole('dialog', { name: 'Unsaved Changes' })).toBeDefined();
    expect(screen.queryByText(/\(1 more\)$/)).toBeNull();

    fireEvent.click(screen.getByText("Don't Save"));
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
    expect(document.querySelectorAll('.tab')).toHaveLength(1);
    expect(document.querySelectorAll('.tab--dirty')).toHaveLength(0);
  });
});
