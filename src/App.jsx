import { useState, useCallback, useRef, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import TabBar from './components/TabBar';
import Sidebar from './components/Sidebar';
import MilkdownEditor from './components/MilkdownEditor';
import FindReplace from './components/FindReplace';
import StatusBar from './components/StatusBar';
import { useTheme } from './hooks/useTheme';
import { useLinter } from './hooks/useLinter';
import { useTabs } from './hooks/useTabs';
import { openFile, saveFile, saveFileAs, getFileName, isDesktopApp } from './utils/fileManager';
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

  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [findVisible, setFindVisible] = useState(false);
  const [editorContentKey, setEditorContentKey] = useState(0); // bumped to force editor reload
  const editorInstanceRef = useRef(null);
  const editorElementRef = useRef(null);

  // Track which tab's content the editor currently shows
  const activeTabIdRef = useRef(activeId);
  const editorContent = activeTab?.content ?? '';

  // When the active tab changes, bump the key to force editor reload
  useEffect(() => {
    if (activeTab && activeTabIdRef.current !== activeTab.id) {
      activeTabIdRef.current = activeTab.id;
      setEditorContentKey((k) => k + 1);
    }
  }, [activeTab?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Lint the active tab's content
  useEffect(() => {
    lint(activeTab?.content || '');
  }, [activeTab?.content, activeTab?.id, lint]);

  const handleMarkdownChange = useCallback(
    (md) => {
      if (activeTabIdRef.current) {
        updateContent(activeTabIdRef.current, md);
      }
    },
    [updateContent]
  );

  // File Operations
  const handleOpen = useCallback(async () => {
    try {
      const result = await openFile();
      if (result) {
        openInTab(result.path, result.content);
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, [openInTab]);

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
        }
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [activeTab, markSaved]);

  const handleSaveAs = useCallback(async () => {
    if (!activeTab) return;
    try {
      const currentContent = editorInstanceRef.current?.getMarkdown?.() || activeTab.content;
      const savedPath = await saveFileAs(currentContent);
      if (savedPath) {
        markSaved(activeTab.id, savedPath, currentContent);
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [activeTab, markSaved]);

  const handleNewTab = useCallback(() => {
    createTab();
    setEditorContentKey((k) => k + 1);
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

  // Sidebar file open
  const handleSidebarFileOpen = useCallback(
    (path, content) => {
      openInTab(path, content);
    },
    [openInTab]
  );

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'o') {
        e.preventDefault();
        handleOpen();
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
  }, [handleOpen, handleSave, handleSaveAs, activeTab, closeTab, cycleTab, handleNewTab]);

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
          <MilkdownEditor
            key={editorContentKey}
            theme={theme}
            onMarkdownChange={handleMarkdownChange}
            externalContent={editorContent}
            editorInstanceRef={editorInstanceRef}
          />
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
