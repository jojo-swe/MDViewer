import { useState, useCallback, useRef, useEffect, useMemo } from 'react';
import TitleBar from './components/TitleBar';
import TabBar from './components/TabBar';
import Sidebar, { type SidebarMode } from './components/Sidebar';
import MilkdownEditor, { type EditorInstance } from './components/MilkdownEditor';
import SourceEditor from './components/SourceEditor';
import FindReplace from './components/FindReplace';
import WelcomeScreen from './components/WelcomeScreen';
import ConfirmDialog from './components/ConfirmDialog';
import ToastContainer from './components/ToastContainer';
import StatusBar from './components/StatusBar';
import SettingsPanel from './components/SettingsPanel';
import CommandPalette from './components/CommandPalette';
import ContextMenu from './components/ContextMenu';
import { useSettings } from './hooks/useSettings';
import { useLinter } from './hooks/useLinter';
import { useTabs } from './hooks/useTabs';
import { useToast } from './hooks/useToast';
import { useCommands } from './hooks/useCommands';
import { useSyncScroll } from './hooks/useSyncScroll';
import { useAutoSave } from './hooks/useAutoSave';
import { useOutline } from './hooks/useOutline';
import { useShortcuts } from './hooks/useShortcuts';
import { useContextMenu, type ContextMenuItem } from './hooks/useContextMenu';
import { useSessionRecovery } from './hooks/useSessionRecovery';
import { openFile, getFileName, isDesktopApp } from './utils/fileManager';
import { saveDocument } from './utils/documentManager';
import { advanceTabClose, planTabClose } from './utils/closeQueue';
import { loadRecoverySession } from './utils/sessionManager';
import { exportToPDF } from './utils/pdfExport';
import type { Tab } from './types/tab';
import type { EditorMode } from './types/settings';
import type { CommandContext } from './types/command';
import type { CloseRequestedEvent } from '@tauri-apps/api/window';
import './App.css';

interface ConfirmState {
  visible: boolean;
  tabId: number | null;
  remainingTabIds: number[];
  isWindowClose?: boolean;
}

const EMPTY_CONFIRM_STATE: ConfirmState = {
  visible: false,
  tabId: null,
  remainingTabIds: [],
};

function App() {
  const { settings, updateSettings, resetSettings, toggleTheme, toggleLint, setEditorMode, setStrictness } = useSettings();
  const [recovery] = useState(() => loadRecoverySession());

  const sourcePaneRef = useRef<HTMLDivElement>(null);
  const previewPaneRef = useRef<HTMLDivElement>(null);

  const { results: lintResults, lint } = useLinter({
    strictness: settings.lint.strictness,
    enabled: settings.lint.enabled,
  });

  const {
    tabs,
    activeTab,
    activeId,
    createTab,
    closeTab,
    closeTabs,
    switchTab,
    updateContent,
    markSaved,
    openInTab,
    cycleTab,
    reorderTabs,
  } = useTabs(recovery.state);

  const toast = useToast();
  const showWarningToast = toast.warning;
  const { markCleanExit } = useSessionRecovery(tabs, activeId);
  const recoveryNotifiedRef = useRef(false);

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [sidebarMode, setSidebarMode] = useState<SidebarMode>('explorer');
  const [cursorPosition, setCursorPosition] = useState<{ line: number; col: number } | null>(null);
  const [selectionLength, setSelectionLength] = useState(0);
  const handleCursorChange = useCallback((line: number, col: number) => {
    setCursorPosition({ line, col });
  }, []);
  const handleSelectionChange = useCallback((length: number) => {
    setSelectionLength(length);
  }, []);
  const [findVisible, setFindVisible] = useState(false);
  const [settingsVisible, setSettingsVisible] = useState(false);
  const [commandPaletteVisible, setCommandPaletteVisible] = useState(false);
  const [editorContentKey, setEditorContentKey] = useState(0);
  const [showWelcome, setShowWelcome] = useState(recovery.state === null);
  const [confirmState, setConfirmState] = useState<ConfirmState>(EMPTY_CONFIRM_STATE);
  const [confirmBusy, setConfirmBusy] = useState(false);
  const editorInstanceRef = useRef<EditorInstance | null>(null);
  const editorElementRef = useRef<HTMLDivElement>(null);
  const unlistenRef = useRef<(() => void) | null>(null);
  const isMountedRef = useRef(true);

  const activeTabIdRef = useRef<number>(activeId);
  const editorContent = activeTab?.content ?? '';
  const isEmptyEditor = tabs.length === 1 && !activeTab?.path && !activeTab?.content;

  useEffect(() => {
    if (!recovery.state || recoveryNotifiedRef.current) return;
    recoveryNotifiedRef.current = true;
    showWarningToast(recovery.incomplete
      ? 'Recovered unsaved work after an unclean shutdown. Some oversized tabs could not be restored.'
      : 'Recovered unsaved work after an unclean shutdown.');
  }, [recovery, showWarningToast]);

  const handleSetEditorMode = useCallback((mode: EditorMode) => {
    setEditorMode(mode);
  }, [setEditorMode]);

  useEffect(() => {
    if (activeTab && activeTabIdRef.current !== activeTab.id) {
      activeTabIdRef.current = activeTab.id;
      setEditorContentKey((k) => k + 1);
    }
  }, [activeTab?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    lint(activeTab?.content || '');
  }, [activeTab?.content, activeTab?.id, lint]);

  const handleMarkdownChange = useCallback(
    (md: string) => {
      if (activeTabIdRef.current) {
        updateContent(activeTabIdRef.current, md);
      }
      if (md && showWelcome) setShowWelcome(false);
    },
    [updateContent, showWelcome]
  );

  // Source editor change handler — update content + bump WYSIWYG key for split mode
  const handleSourceChange = useCallback(
    (newContent: string) => {
      if (activeTabIdRef.current) {
        updateContent(activeTabIdRef.current, newContent);
      }
      if (settings.editorMode === 'split') {
        setEditorContentKey((k) => k + 1);
      }
      if (newContent && showWelcome) setShowWelcome(false);
    },
    [updateContent, settings.editorMode, showWelcome]
  );

  // --- File Operations ---
  const addRecentFile = useCallback((path: string, filename: string) => {
    const existing = settings.recentFiles.filter((f) => f.path !== path);
    const updated = [{ path, filename, openedAt: Date.now() }, ...existing].slice(0, 10);
    updateSettings({ recentFiles: updated });
  }, [settings.recentFiles, updateSettings]);

  const clearRecentFiles = useCallback(() => {
    updateSettings({ recentFiles: [] });
  }, [updateSettings]);

  const handleOpen = useCallback(async () => {
    try {
      const result = await openFile();
      if (result) {
        openInTab(result.path, result.content);
        addRecentFile(result.path, getFileName(result.path));
        setShowWelcome(false);
        toast.success(`Opened ${getFileName(result.path)}`);
      }
    } catch (err) {
      toast.error(`Failed to open file: ${(err as Error).message}`);
    }
  }, [openInTab, addRecentFile, toast]);

  const handleOpenRecent = useCallback(
    async (path: string) => {
      try {
        let tauriFs: typeof import('@tauri-apps/plugin-fs') | undefined;
        try { tauriFs = await import('@tauri-apps/plugin-fs'); } catch { /* browser */ }
        if (tauriFs) {
          const content = await tauriFs.readTextFile(path);
          openInTab(path, content);
          addRecentFile(path, getFileName(path));
          setShowWelcome(false);
          toast.success(`Opened ${getFileName(path)}`);
        }
      } catch (err) {
        toast.error(`Failed to open: ${(err as Error).message}`);
      }
    },
    [openInTab, addRecentFile, toast]
  );

  const persistTab = useCallback(async (
    tab: Tab,
    content: string,
    options: { forceSaveAs?: boolean; showSuccess?: boolean } = {}
  ) => {
    const result = await saveDocument(tab, content, { forceSaveAs: options.forceSaveAs });
    if (result.status === 'saved') {
      markSaved(tab.id, result.path, result.content);
      addRecentFile(result.path, getFileName(result.path));
      if (options.showSuccess !== false) {
        toast.success(`${options.forceSaveAs || !tab.path ? 'Saved as' : 'Saved'} ${getFileName(result.path)}`);
      }
    } else if (result.status === 'failed') {
      toast.error(`Save failed: ${result.error.message}`);
    } else if (result.status === 'conflict') {
      toast.warning(result.reason === 'deleted'
        ? `${tab.filename} was deleted outside MDViewer. Use Save As to preserve your changes.`
        : `${tab.filename} changed outside MDViewer. Your changes were not overwritten.`);
    }
    return result;
  }, [markSaved, addRecentFile, toast]);

  const handleSave = useCallback(async () => {
    if (!activeTab) return;
    const currentContent = editorInstanceRef.current?.getMarkdown?.() || activeTab.content;
    await persistTab(activeTab, currentContent);
  }, [activeTab, persistTab]);

  const handleSaveAs = useCallback(async () => {
    if (!activeTab) return;
    const currentContent = editorInstanceRef.current?.getMarkdown?.() || activeTab.content;
    await persistTab(activeTab, currentContent, { forceSaveAs: true });
  }, [activeTab, persistTab]);

  const handleExportPDF = useCallback(() => {
    const title = getFileName(activeTab?.path) || 'Untitled';
    exportToPDF(title);
    toast.info('Opening print dialog for PDF export...');
  }, [activeTab?.path, toast]);

  // --- Sync scroll (split view) ---
  useSyncScroll(sourcePaneRef, previewPaneRef, {
    enabled: settings.editorMode === 'split' && settings.syncScroll,
  });

  // --- Auto-save ---
  const handleAutoSave = useCallback(async (tab: Tab) => {
    const result = await persistTab(tab, tab.content, { showSuccess: false });
    if (result.status === 'failed') throw result.error;
    if (result.status === 'cancelled') throw new Error('Autosave was cancelled');
    if (result.status === 'conflict') throw new Error(`Autosave blocked: file was ${result.reason}`);
  }, [persistTab]);

  const { status: autoSaveStatus } = useAutoSave(
    activeTab,
    { enabled: settings.autoSave.enabled, interval: settings.autoSave.interval },
    { onSave: handleAutoSave }
  );

  // --- Outline ---
  const { headings, activeId: activeHeadingId, scrollToHeading } = useOutline(editorContent);

  const handleNewTab = useCallback(() => {
    createTab();
    setEditorContentKey((k) => k + 1);
    setShowWelcome(false);
  }, [createTab]);

  // --- Save-before-close ---
  const destroyWindow = useCallback(async () => {
    markCleanExit();
    try {
      const { getCurrentWindow } = await import('@tauri-apps/api/window');
      await getCurrentWindow().destroy();
    } catch {
      // Browser/test environment: there is no native window to destroy.
    }
  }, [markCleanExit]);

  const requestCloseTabs = useCallback((ids: number[], isWindowClose = false) => {
    if (confirmState.visible) return;

    const plan = planTabClose(tabs, ids, isWindowClose);
    closeTabs(plan.cleanTabIds);

    if (!plan.queue) {
      if (plan.shouldCloseWindow) void destroyWindow();
      return;
    }

    setConfirmState({
      visible: true,
      tabId: plan.queue.currentTabId,
      remainingTabIds: plan.queue.remainingTabIds,
      isWindowClose: plan.queue.isWindowClose,
    });
  }, [confirmState.visible, tabs, closeTabs, destroyWindow]);

  const handleCloseTab = useCallback((id: number) => {
    requestCloseTabs([id]);
  }, [requestCloseTabs]);

  const advanceCloseQueue = useCallback(async () => {
    if (confirmState.tabId === null) return;
    const next = advanceTabClose({
      currentTabId: confirmState.tabId,
      remainingTabIds: confirmState.remainingTabIds,
      isWindowClose: confirmState.isWindowClose === true,
    });

    if (next.queue) {
      setConfirmState({
        visible: true,
        tabId: next.queue.currentTabId,
        remainingTabIds: next.queue.remainingTabIds,
        isWindowClose: next.queue.isWindowClose,
      });
      return;
    }

    setConfirmState(EMPTY_CONFIRM_STATE);
    if (next.shouldCloseWindow) await destroyWindow();
  }, [confirmState.tabId, confirmState.remainingTabIds, confirmState.isWindowClose, destroyWindow]);

  const handleConfirmSave = useCallback(async () => {
    const tab = tabs.find((candidate) => candidate.id === confirmState.tabId);
    if (!tab || confirmBusy) return;

    setConfirmBusy(true);
    const result = await persistTab(tab, tab.content);
    setConfirmBusy(false);

    // Cancellation and failure must never be interpreted as permission to
    // close. Keep the dialog open so the user can retry, discard, or cancel.
    if (result.status !== 'saved') return;

    closeTab(tab.id);
    await advanceCloseQueue();
  }, [tabs, confirmState.tabId, confirmBusy, persistTab, closeTab, advanceCloseQueue]);

  const handleConfirmDiscard = useCallback(async () => {
    const tabId = confirmState.tabId;
    if (tabId === null || confirmBusy) return;
    closeTab(tabId);
    await advanceCloseQueue();
  }, [confirmState.tabId, confirmBusy, closeTab, advanceCloseQueue]);

  const handleConfirmCancel = useCallback(() => {
    if (confirmBusy) return;
    setConfirmState(EMPTY_CONFIRM_STATE);
  }, [confirmBusy]);

  // --- Find & Replace ---
  const handleReplace = useCallback(
    (transformFn: (markdown: string) => string) => {
      if (!activeTab) return;
      const currentMarkdown = editorInstanceRef.current?.getMarkdown?.() || activeTab.content;
      const newMarkdown = transformFn(currentMarkdown);
      if (newMarkdown !== currentMarkdown) {
        updateContent(activeTab.id, newMarkdown);
        setEditorContentKey((k) => k + 1);
        toast.info('Replaced');
      }
    },
    [activeTab, updateContent, toast]
  );

  const handleSwitchTab = useCallback((id: number) => switchTab(id), [switchTab]);

  const handleSidebarFileOpen = useCallback(
    (path: string, content: string) => {
      openInTab(path, content);
      addRecentFile(path, getFileName(path));
      setShowWelcome(false);
    },
    [openInTab, addRecentFile]
  );

  // --- Command palette context ---
  const commandContext: CommandContext = useMemo(() => ({
    openFile: handleOpen,
    saveFile: handleSave,
    saveFileAs: handleSaveAs,
    newTab: handleNewTab,
    closeTab: () => { if (activeTab) handleCloseTab(activeTab.id); },
    exportPDF: handleExportPDF,
    toggleSidebar: () => setSidebarVisible((v) => !v),
    toggleFind: () => setFindVisible((v) => !v),
    toggleSettings: () => setSettingsVisible((v) => !v),
    cycleTabs: (dir: number) => cycleTab(dir),
    setEditorMode: handleSetEditorMode,
    toggleLint,
    setStrictness: (level: import('./types/lint').StrictnessLevel) => setStrictness(level),
    resetSettings,
    toggleWordWrap: () => updateSettings({ wordWrap: !settings.wordWrap }),
    toggleOutline: () => {
      setSidebarMode((m) => m === 'outline' ? 'explorer' : 'outline');
      setSidebarVisible(true);
    },
    toggleCommandPalette: () => setCommandPaletteVisible((v) => !v),
  }), [handleOpen, handleSave, handleSaveAs, handleNewTab, activeTab, handleCloseTab, handleExportPDF, cycleTab, handleSetEditorMode, toggleLint, setStrictness, resetSettings, updateSettings, settings.wordWrap]);

  const commands = useCommands(commandContext);

  // --- Context menu ---
  const { menuState: contextMenuState, menuRef: contextMenuRef, showMenu: showContextMenu, hideMenu: hideContextMenu } = useContextMenu();

  const handleTabContextMenu = useCallback((e: React.MouseEvent, tab: Tab) => {
    e.preventDefault();
    const items: ContextMenuItem[] = [
      { id: 'close', label: 'Close', onClick: () => handleCloseTab(tab.id) },
      { id: 'close-others', label: 'Close Others', onClick: () => requestCloseTabs(tabs.filter(t => t.id !== tab.id).map(t => t.id)) },
      { id: 'close-all', label: 'Close All', onClick: () => requestCloseTabs(tabs.map(t => t.id)) },
      { id: 'sep1', separator: true },
      { id: 'copy-path', label: 'Copy Path', disabled: !tab.path, onClick: () => { if (tab.path) navigator.clipboard.writeText(tab.path); } },
    ];
    showContextMenu(e.clientX, e.clientY, items);
  }, [handleCloseTab, requestCloseTabs, tabs, showContextMenu]);

  // --- Keyboard shortcuts ---
  const { handleKeyDown: handleShortcut } = useShortcuts(commands, commandContext, settings.customShortcuts);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (handleShortcut(e)) return;
      if (e.key === 'Escape') {
        setFindVisible(false);
        setCommandPaletteVisible(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleShortcut]);

  const handleExecuteCommand = useCallback((cmd: import('./types/command').Command) => {
    cmd.action(commandContext);
  }, [commandContext]);

  // --- Drag & Drop ---
  useEffect(() => {
    const handleDragOver = (e: DragEvent) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = async (e: DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer?.files || []);
      for (const file of files) {
        if (/\.(md|markdown|mdown|mkd|mdx|txt)$/i.test(file.name)) {
          const content = await file.text();
          openInTab(file.name, content);
          setShowWelcome(false);
          toast.success(`Opened ${file.name}`);
        }
      }
    };
    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [openInTab, toast]);

  const showTitleBar = isDesktopApp();

  // --- Handle window close (X button) ---
  useEffect(() => {
    if (!showTitleBar) return; // Only in desktop app

    isMountedRef.current = true;
    unlistenRef.current = null;

    const handleWindowClose = async (event: CloseRequestedEvent) => {
      event.preventDefault(); // Prevent immediate close

      requestCloseTabs(tabs.map((tab) => tab.id), true);
    };

    const setupListener = async () => {
      try {
        const { getCurrentWindow } = await import('@tauri-apps/api/window');
        if (isMountedRef.current) {
          unlistenRef.current = await getCurrentWindow().onCloseRequested(handleWindowClose);
        }
      } catch {
        // Not in Tauri environment, ignore
      }
    };
    setupListener();

    return () => {
      const unlisten = unlistenRef.current;
      isMountedRef.current = false;
      unlistenRef.current = null;
      if (unlisten) {
        unlisten();
      }
    };
  }, [showTitleBar, tabs, requestCloseTabs]);

  // --- Render the editor area based on mode ---
  const renderEditor = () => {
    if (showWelcome && isEmptyEditor) {
      return (
        <WelcomeScreen
          recentFiles={settings.recentFiles}
          onOpenFile={handleOpen}
          onOpenRecent={handleOpenRecent}
          onNewFile={handleNewTab}
          onClearRecent={clearRecentFiles}
        />
      );
    }

    switch (settings.editorMode) {
      case 'source':
        return (
          <SourceEditor
            value={editorContent}
            onChange={handleSourceChange}
            fontSize={settings.fontSize}
            wordWrap={settings.wordWrap}
            onCursorChange={handleCursorChange}
            onSelectionChange={handleSelectionChange}
          />
        );

      case 'split':
        return (
          <div className="split-view">
            <div className="split-pane split-pane--source" ref={sourcePaneRef}>
              <SourceEditor
                value={editorContent}
                onChange={handleSourceChange}
                fontSize={settings.fontSize}
                wordWrap={settings.wordWrap}
                onCursorChange={handleCursorChange}
                onSelectionChange={handleSelectionChange}
              />
            </div>
            <div className="split-divider" />
            <div className="split-pane split-pane--preview" ref={previewPaneRef}>
              <MilkdownEditor
                key={editorContentKey}
                theme={settings.theme}
                onMarkdownChange={handleMarkdownChange}
                externalContent={editorContent}
                editorInstanceRef={editorInstanceRef}
                fontSize={settings.fontSize}
                wordWrap={settings.wordWrap}
                basePath={activeTab?.path ?? null}
              />
            </div>
          </div>
        );

      case 'wysiwyg':
      default:
        return (
          <MilkdownEditor
            key={editorContentKey}
            theme={settings.theme}
            onMarkdownChange={handleMarkdownChange}
            externalContent={editorContent}
            editorInstanceRef={editorInstanceRef}
            fontSize={settings.fontSize}
            wordWrap={settings.wordWrap}
            basePath={activeTab?.path ?? null}
          />
        );
    }
  };

  const confirmTab: Tab | undefined = tabs.find((t) => t.id === confirmState.tabId);

  return (
    <div className="app" data-theme={settings.theme}>
      {showTitleBar && (
        <TitleBar
          filename={getFileName(activeTab?.path)}
          isDirty={activeTab?.isDirty || false}
        />
      )}

      <TabBar
        tabs={tabs}
        activeId={activeId}
        onSwitch={handleSwitchTab}
        onClose={handleCloseTab}
        onNew={handleNewTab}
        onContextMenu={handleTabContextMenu}
        onReorder={reorderTabs}
      />

      <div className="app-body">
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onFileOpen={handleSidebarFileOpen}
          mode={sidebarMode}
          onModeChange={setSidebarMode}
          headings={headings}
          activeHeadingId={activeHeadingId}
          onHeadingClick={scrollToHeading}
        />

        <div className="editor-pane" ref={editorElementRef}>
          <FindReplace
            visible={findVisible}
            onClose={() => setFindVisible(false)}
            containerRef={editorElementRef}
            onReplace={handleReplace}
          />
          {renderEditor()}
        </div>
      </div>

      <StatusBar
        theme={settings.theme}
        onToggleTheme={toggleTheme}
        markdown={activeTab?.content || ''}
        lintResults={lintResults}
        lintStrictness={settings.lint.strictness}
        onSetStrictness={setStrictness}
        lintEnabled={settings.lint.enabled}
        onToggleLint={toggleLint}
        editorMode={settings.editorMode}
        onSetEditorMode={handleSetEditorMode}
        onOpenSettings={() => setSettingsVisible(true)}
        autoSaveStatus={autoSaveStatus}
        cursorPosition={settings.editorMode === 'source' || settings.editorMode === 'split' ? cursorPosition : null}
        selectionLength={settings.editorMode === 'source' || settings.editorMode === 'split' ? selectionLength : undefined}
        filePath={activeTab?.path ?? null}
      />

      <SettingsPanel
        visible={settingsVisible}
        settings={settings}
        onClose={() => setSettingsVisible(false)}
        onUpdate={updateSettings}
        onReset={resetSettings}
      />

      <CommandPalette
        visible={commandPaletteVisible}
        commands={commands}
        onClose={() => setCommandPaletteVisible(false)}
        onExecute={handleExecuteCommand}
      />

      <ConfirmDialog
        visible={confirmState.visible}
        title="Unsaved Changes"
        message={`"${getFileName(confirmTab?.path) || 'Untitled'}" has unsaved changes. Save before closing?${confirmState.remainingTabIds.length > 0 ? ` (${confirmState.remainingTabIds.length} more)` : ''}`}
        onConfirm={handleConfirmSave}
        onDanger={handleConfirmDiscard}
        onCancel={handleConfirmCancel}
        busy={confirmBusy}
      />

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />

      <ContextMenu
        visible={contextMenuState.visible}
        x={contextMenuState.x}
        y={contextMenuState.y}
        items={contextMenuState.items}
        menuRef={contextMenuRef}
        onItemClick={(item) => {
          hideContextMenu();
          item.onClick?.();
        }}
      />
    </div>
  );
}

export default App;
