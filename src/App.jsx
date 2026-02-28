import { useState, useCallback, useRef, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import TabBar from './components/TabBar';
import Sidebar from './components/Sidebar';
import MilkdownEditor from './components/MilkdownEditor';
import FindReplace from './components/FindReplace';
import WelcomeScreen from './components/WelcomeScreen';
import StatusBar from './components/StatusBar';
import { useTheme } from './hooks/useTheme';
import { useLinter } from './hooks/useLinter';
import { useTabs } from './hooks/useTabs';
import { useRecentFiles } from './hooks/useRecentFiles';
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

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [findVisible, setFindVisible] = useState(false);
  const [editorContentKey, setEditorContentKey] = useState(0);
  const [showWelcome, setShowWelcome] = useState(true);
  const editorInstanceRef = useRef(null);
  const editorElementRef = useRef(null);

  const activeTabIdRef = useRef(activeId);
  const editorContent = activeTab?.content ?? '';

  // Determine if we should show the welcome screen
  // Show it when there's only one tab and it has no content and no path
  const isEmptyEditor = tabs.length === 1 && !activeTab?.path && !activeTab?.content;

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
      // Hide welcome screen once user starts typing
      if (md && showWelcome) {
        setShowWelcome(false);
      }
    },
    [updateContent, showWelcome]
  );

  // File Operations
  const handleOpen = useCallback(async () => {
    try {
      const result = await openFile();
      if (result) {
        openInTab(result.path, result.content);
        addFile(result.path, getFileName(result.path));
        setShowWelcome(false);
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, [openInTab, addFile]);

  const handleOpenRecent = useCallback(
    async (path) => {
      try {
        // Try reading the file via Tauri or fallback
        let tauriFs;
        try {
          tauriFs = await import('@tauri-apps/plugin-fs');
        } catch {
          // Not in Tauri
        }
        if (tauriFs) {
          const content = await tauriFs.readTextFile(path);
          openInTab(path, content);
          addFile(path, getFileName(path));
          setShowWelcome(false);
        }
      } catch (err) {
        console.error('Failed to open recent file:', err);
      }
    },
    [openInTab, addFile]
  );

  const handleSave = useCallback(async () => {
    if (!activeTab) return;
    try {
      const currentContent = editorInstanceRef.current?.getMarkdown?.() || activeTab.content;
      if (activeTab.path) {
        await saveFile(activeTab.path, currentContent);
        markSaved(activeTab.id, activeTab.path, currentContent);
      } else {
        const savedPath = await saveFileAs(currentContent);
        if (savedPath) {
          markSaved(activeTab.id, savedPath, currentContent);
          addFile(savedPath, getFileName(savedPath));
        }
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [activeTab, markSaved, addFile]);

  const handleSaveAs = useCallback(async () => {
    if (!activeTab) return;
    try {
      const currentContent = editorInstanceRef.current?.getMarkdown?.() || activeTab.content;
      const savedPath = await saveFileAs(currentContent);
      if (savedPath) {
        markSaved(activeTab.id, savedPath, currentContent);
        addFile(savedPath, getFileName(savedPath));
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [activeTab, markSaved, addFile]);

  const handleExportPDF = useCallback(() => {
    const title = getFileName(activeTab?.path) || 'Untitled';
    exportToPDF(title);
  }, [activeTab?.path]);

  const handleNewTab = useCallback(() => {
    createTab();
    setEditorContentKey((k) => k + 1);
    setShowWelcome(false);
  }, [createTab]);

  const handleCloseTab = useCallback(
    (id) => {
      closeTab(id);
    },
    [closeTab]
  );

  const handleSwitchTab = useCallback(
    (id) => {
      switchTab(id);
    },
    [switchTab]
  );

  const handleSidebarFileOpen = useCallback(
    (path, content) => {
      openInTab(path, content);
      addFile(path, getFileName(path));
      setShowWelcome(false);
    },
    [openInTab, addFile]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      } else if (isMod && e.shiftKey && (e.key === 'E' || e.key === 'e')) {
        e.preventDefault();
        handleExportPDF();
      } else if (isMod && e.shiftKey && (e.key === 'S' || e.key === 's')) {
        e.preventDefault();
        handleSaveAs();
      } else if (isMod && e.key === 's') {
        e.preventDefault();
        handleSave();
      } else if (isMod && e.key === 'b') {
        e.preventDefault();
        setSidebarVisible((v) => !v);
      } else if (isMod && e.key === 'f') {
        e.preventDefault();
        setFindVisible(true);
      } else if (isMod && e.key === 'h') {
        e.preventDefault();
        setFindVisible(true);
      } else if (isMod && e.key === 'w') {
        e.preventDefault();
        if (activeTab) closeTab(activeTab.id);
      } else if (e.key === 'Escape') {
        setFindVisible(false);
      } else if (isMod && e.key === 'Tab') {
        e.preventDefault();
        cycleTab(e.shiftKey ? -1 : 1);
      } else if (isMod && e.key === 'n') {
        e.preventDefault();
        handleNewTab();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpen, handleSave, handleSaveAs, handleExportPDF, activeTab, closeTab, cycleTab, handleNewTab]);

  // Drag & Drop support
  useEffect(() => {
    const handleDragOver = (e) => {
      e.preventDefault();
      e.stopPropagation();
    };

    const handleDrop = async (e) => {
      e.preventDefault();
      e.stopPropagation();
      const files = Array.from(e.dataTransfer.files);
      for (const file of files) {
        if (/\.(md|markdown|mdown|mkd|mdx|txt)$/i.test(file.name)) {
          const content = await file.text();
          openInTab(file.name, content);
          setShowWelcome(false);
        }
      }
    };

    window.addEventListener('dragover', handleDragOver);
    window.addEventListener('drop', handleDrop);
    return () => {
      window.removeEventListener('dragover', handleDragOver);
      window.removeEventListener('drop', handleDrop);
    };
  }, [openInTab]);

  const showTitleBar = isDesktopApp();

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
          />
          {showWelcome && isEmptyEditor ? (
            <WelcomeScreen
              recentFiles={recentFiles}
              onOpenFile={handleOpen}
              onOpenRecent={handleOpenRecent}
              onNewFile={handleNewTab}
              onClearRecent={clearRecentFiles}
            />
          ) : (
            <MilkdownEditor
              key={editorContentKey}
              theme={theme}
              onMarkdownChange={handleMarkdownChange}
              externalContent={editorContent}
              editorInstanceRef={editorInstanceRef}
            />
          )}
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
      />
    </div>
  );
}

export default App;
