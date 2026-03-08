import { useState, useCallback, useRef, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import TabBar from './components/TabBar';
import Sidebar from './components/Sidebar';
import MilkdownEditor from './components/MilkdownEditor';
import SourceEditor from './components/SourceEditor';
import FindReplace from './components/FindReplace';
import WelcomeScreen from './components/WelcomeScreen';
import ConfirmDialog from './components/ConfirmDialog';
import ToastContainer from './components/ToastContainer';
import StatusBar from './components/StatusBar';
import { useTheme } from './hooks/useTheme';
import { useLinter } from './hooks/useLinter';
import { useTabs } from './hooks/useTabs';
import { useRecentFiles } from './hooks/useRecentFiles';
import { useToast } from './hooks/useToast';
import { openFile, saveFile, saveFileAs, getFileName, isDesktopApp } from './utils/fileManager';
import { exportToPDF } from './utils/pdfExport';
import './App.css';

function App() {
  const { theme, toggleTheme } = useTheme();
  const {
    strictness,
    setStrictness,
    results: lintResults,
    lint,
    enabled: lintEnabled,
    toggleEnabled: toggleLint,
  } = useLinter('standard');

  const {
    tabs,
    activeTab,
    activeId,
    createTab,
    closeTab,
    switchTab,
    updateContent,
    markSaved,
    openInTab,
    cycleTab,
  } = useTabs();

  const { recentFiles, addFile, clearAll: clearRecentFiles } = useRecentFiles();
  const toast = useToast();

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [findVisible, setFindVisible] = useState(false);
  const [editorContentKey, setEditorContentKey] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const [confirmState, setConfirmState] = useState({ visible: false, tabId: null });
  const [editorMode, setEditorMode] = useState(() => localStorage.getItem('mdviewer-editor-mode') || 'wysiwyg');
  const editorInstanceRef = useRef(null);
  const editorElementRef = useRef(null);
  const unlistenRef = useRef(null);
  const isMountedRef = useRef(true);

  const activeTabIdRef = useRef(activeId);
  const editorContent = activeTab?.content ?? '';
  const isEmptyEditor = tabs.length === 1 && !activeTab?.path && !activeTab?.content;

  // Persist editor mode
  const handleSetEditorMode = useCallback((mode) => {
    setEditorMode(mode);
    localStorage.setItem('mdviewer-editor-mode', mode);
  }, []);

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
    (md) => {
      if (activeTabIdRef.current) {
        updateContent(activeTabIdRef.current, md);
      }
      if (md && showWelcome) setShowWelcome(false);
    },
    [updateContent, showWelcome]
  );

  // Source editor change handler — update content + bump WYSIWYG key for split mode
  const handleSourceChange = useCallback(
    (newContent) => {
      if (activeTabIdRef.current) {
        updateContent(activeTabIdRef.current, newContent);
      }
      if (editorMode === 'split') {
        setEditorContentKey((k) => k + 1);
      }
      if (newContent && showWelcome) setShowWelcome(false);
    },
    [updateContent, editorMode, showWelcome]
  );

  // --- File Operations ---
  const handleOpen = useCallback(async () => {
    try {
      const result = await openFile();
      if (result) {
        openInTab(result.path, result.content);
        addFile(result.path, getFileName(result.path));
        setShowWelcome(false);
        toast.success(`Opened ${getFileName(result.path)}`);
      }
    } catch (err) {
      toast.error(`Failed to open file: ${err.message}`);
    }
  }, [openInTab, addFile, toast]);

  const handleOpenRecent = useCallback(
    async (path) => {
      try {
        let tauriFs;
        try { tauriFs = await import('@tauri-apps/plugin-fs'); } catch { /* browser */ }
        if (tauriFs) {
          const content = await tauriFs.readTextFile(path);
          openInTab(path, content);
          addFile(path, getFileName(path));
          setShowWelcome(false);
          toast.success(`Opened ${getFileName(path)}`);
        }
      } catch (err) {
        toast.error(`Failed to open: ${err.message}`);
      }
    },
    [openInTab, addFile, toast]
  );

  const handleSave = useCallback(async () => {
    if (!activeTab) return;
    try {
      const currentContent = editorInstanceRef.current?.getMarkdown?.() || activeTab.content;
      if (activeTab.path) {
        await saveFile(activeTab.path, currentContent);
        markSaved(activeTab.id, activeTab.path, currentContent);
        addFile(activeTab.path, getFileName(activeTab.path));
        toast.success(`Saved ${getFileName(activeTab.path)}`);
      } else {
        const savedPath = await saveFileAs(currentContent);
        if (savedPath) {
          markSaved(activeTab.id, savedPath, currentContent);
          addFile(savedPath, getFileName(savedPath));
          toast.success(`Saved as ${getFileName(savedPath)}`);
        }
      }
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    }
  }, [activeTab, markSaved, addFile, toast]);

  const handleSaveAs = useCallback(async () => {
    if (!activeTab) return;
    try {
      const currentContent = editorInstanceRef.current?.getMarkdown?.() || activeTab.content;
      const savedPath = await saveFileAs(currentContent);
      if (savedPath) {
        markSaved(activeTab.id, savedPath, currentContent);
        addFile(savedPath, getFileName(savedPath));
        toast.success(`Saved as ${getFileName(savedPath)}`);
      }
    } catch (err) {
      toast.error(`Save failed: ${err.message}`);
    }
  }, [activeTab, markSaved, addFile, toast]);

  const handleExportPDF = useCallback(() => {
    const title = getFileName(activeTab?.path) || 'Untitled';
    exportToPDF(title);
    toast.info('Opening print dialog for PDF export...');
  }, [activeTab?.path, toast]);

  const handleNewTab = useCallback(() => {
    createTab();
    setEditorContentKey((k) => k + 1);
    setShowWelcome(false);
  }, [createTab]);

  // --- Save-before-close ---
  const handleCloseTab = useCallback(
    (id) => {
      const tab = tabs.find((t) => t.id === id);
      if (tab?.isDirty) {
        setConfirmState({ visible: true, tabId: id });
      } else {
        closeTab(id);
      }
    },
    [tabs, closeTab]
  );

  const handleConfirmSave = useCallback(async () => {
    const tabId = confirmState.tabId;
    const isWindowClose = confirmState.isWindowClose;
    const tab = tabs.find((t) => t.id === tabId);
    if (tab) {
      try {
        if (tab.path) {
          await saveFile(tab.path, tab.content);
          toast.success(`Saved ${getFileName(tab.path)}`);
        } else {
          const savedPath = await saveFileAs(tab.content);
          if (savedPath) toast.success(`Saved as ${getFileName(savedPath)}`);
        }
      } catch (err) {
        toast.error(`Save failed: ${err.message}`);
      }
    }
    closeTab(tabId);
    setConfirmState({ visible: false, tabId: null });

    // If this was a window close, check if there are more dirty tabs
    if (isWindowClose) {
      const remainingDirty = tabs.filter(t => t.isDirty && t.id !== tabId);
      if (remainingDirty.length === 0) {
        // No more dirty tabs, close the window
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          await getCurrentWindow().destroy();
        } catch {
          // Not in Tauri environment, ignore
        }
      } else {
        // Show dialog for the next dirty tab
        const nextDirty = remainingDirty[0];
        setConfirmState({ 
          visible: true, 
          tabId: nextDirty.id,
          isWindowClose: true
        });
      }
    }
  }, [confirmState.tabId, confirmState.isWindowClose, tabs, closeTab, toast]);

  const handleConfirmDiscard = useCallback(async () => {
    const isWindowClose = confirmState.isWindowClose;
    closeTab(confirmState.tabId);
    setConfirmState({ visible: false, tabId: null });

    // If this was a window close, check if there are more dirty tabs
    if (isWindowClose) {
      const remainingDirty = tabs.filter(t => t.isDirty && t.id !== confirmState.tabId);
      if (remainingDirty.length === 0) {
        // No more dirty tabs, close the window
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          await getCurrentWindow().destroy();
        } catch {
          // Not in Tauri environment, ignore
        }
      } else {
        // Show dialog for the next dirty tab
        const nextDirty = remainingDirty[0];
        setConfirmState({ 
          visible: true, 
          tabId: nextDirty.id,
          isWindowClose: true
        });
      }
    }
  }, [confirmState.tabId, confirmState.isWindowClose, tabs, closeTab]);

  const handleConfirmCancel = useCallback(() => {
    setConfirmState({ visible: false, tabId: null });
  }, []);

  // --- Find & Replace ---
  const handleReplace = useCallback(
    (transformFn) => {
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

  const handleSwitchTab = useCallback((id) => switchTab(id), [switchTab]);

  const handleSidebarFileOpen = useCallback(
    (path, content) => {
      openInTab(path, content);
      addFile(path, getFileName(path));
      setShowWelcome(false);
    },
    [openInTab, addFile]
  );

  // --- Keyboard shortcuts ---
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'o') {
        e.preventDefault(); handleOpen();
      } else if (isMod && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault(); handleExportPDF();
      } else if (isMod && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault(); handleSaveAs();
      } else if (isMod && e.key === 's') {
        e.preventDefault(); handleSave();
      } else if (isMod && e.key === 'b') {
        e.preventDefault(); setSidebarVisible((v) => !v);
      } else if (isMod && e.key === 'f') {
        e.preventDefault(); setFindVisible(true);
      } else if (isMod && e.key === 'h') {
        e.preventDefault(); setFindVisible(true);
      } else if (isMod && e.key === 'w') {
        e.preventDefault();
        if (activeTab) handleCloseTab(activeTab.id);
      } else if (e.key === 'Escape') {
        setFindVisible(false);
      } else if (isMod && e.key === 'Tab') {
        e.preventDefault(); cycleTab(e.shiftKey ? -1 : 1);
      } else if (isMod && e.key === 'n') {
        e.preventDefault(); handleNewTab();
      // Editor mode shortcuts: Ctrl+Alt+1/2/3
      } else if (isMod && e.altKey && e.key === '1') {
        e.preventDefault(); handleSetEditorMode('wysiwyg');
      } else if (isMod && e.altKey && e.key === '2') {
        e.preventDefault(); handleSetEditorMode('source');
      } else if (isMod && e.altKey && e.key === '3') {
        e.preventDefault(); handleSetEditorMode('split');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpen, handleSave, handleSaveAs, handleExportPDF, activeTab, handleCloseTab, cycleTab, handleNewTab, handleSetEditorMode]);

  // --- Drag & Drop ---
  useEffect(() => {
    const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
    const handleDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files);
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

    const handleWindowClose = async (event) => {
      event.preventDefault(); // Prevent immediate close

      const dirtyTabs = tabs.filter(t => t.isDirty);
      if (dirtyTabs.length === 0) {
        // No unsaved changes, allow close
        try {
          const { getCurrentWindow } = await import('@tauri-apps/api/window');
          await getCurrentWindow().destroy();
        } catch {
          // Not in Tauri environment, ignore
        }
        return;
      }

      // Show save dialog for the first dirty tab
      const firstDirty = dirtyTabs[0];
      setConfirmState({ 
        visible: true, 
        tabId: firstDirty.id,
        isWindowClose: true // Flag to indicate this is a window close
      });
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
      isMountedRef.current = false;
      if (unlistenRef.current) {
        unlistenRef.current();
      }
    };
  }, [showTitleBar, tabs]);

  // --- Render the editor area based on mode ---
  const renderEditor = () => {
    if (showWelcome && isEmptyEditor) {
      return (
        <WelcomeScreen
          recentFiles={recentFiles}
          onOpenFile={handleOpen}
          onOpenRecent={handleOpenRecent}
          onNewFile={handleNewTab}
          onClearRecent={clearRecentFiles}
        />
      );
    }

    switch (editorMode) {
      case 'source':
        return (
          <SourceEditor
            value={editorContent}
            onChange={handleSourceChange}
          />
        );

      case 'split':
        return (
          <div className="split-view">
            <div className="split-pane split-pane--source">
              <SourceEditor
                value={editorContent}
                onChange={handleSourceChange}
              />
            </div>
            <div className="split-divider" />
            <div className="split-pane split-pane--preview">
              <MilkdownEditor
                key={editorContentKey}
                theme={theme}
                onMarkdownChange={handleMarkdownChange}
                externalContent={editorContent}
                editorInstanceRef={editorInstanceRef}
              />
            </div>
          </div>
        );

      case 'wysiwyg':
      default:
        return (
          <MilkdownEditor
            key={editorContentKey}
            theme={theme}
            onMarkdownChange={handleMarkdownChange}
            externalContent={editorContent}
            editorInstanceRef={editorInstanceRef}
          />
        );
    }
  };

  return (
    <div className="app" data-theme={theme}>
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
      />

      <div className="app-body">
        <Sidebar
          visible={sidebarVisible}
          onClose={() => setSidebarVisible(false)}
          onFileOpen={handleSidebarFileOpen}
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
        theme={theme}
        onToggleTheme={toggleTheme}
        markdown={activeTab?.content || ''}
        lintResults={lintResults}
        lintStrictness={strictness}
        onSetStrictness={setStrictness}
        lintEnabled={lintEnabled}
        onToggleLint={toggleLint}
        editorMode={editorMode}
        onSetEditorMode={handleSetEditorMode}
      />

      <ConfirmDialog
        visible={confirmState.visible}
        title="Unsaved Changes"
        message={`"${getFileName(tabs.find((t) => t.id === confirmState.tabId)?.path) || 'Untitled'}" has unsaved changes. Save before closing?`}
        onConfirm={handleConfirmSave}
        onDanger={handleConfirmDiscard}
        onCancel={handleConfirmCancel}
      />

      <ToastContainer toasts={toast.toasts} onDismiss={toast.dismiss} />
    </div>
  );
}

export default App;
