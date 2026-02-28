import { useState, useCallback, useRef, useEffect } from 'react';
import TitleBar from './components/TitleBar';
import MilkdownEditor from './components/MilkdownEditor';
import StatusBar from './components/StatusBar';
import { useTheme } from './hooks/useTheme';
import { useLinter } from './hooks/useLinter';
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

  const [markdown, setMarkdown] = useState('');
  const [filePath, setFilePath] = useState(null);
  const [isDirty, setIsDirty] = useState(false);
  const [externalContent, setExternalContent] = useState(null);
  const editorInstanceRef = useRef(null);
  const savedContentRef = useRef('');

  const handleMarkdownChange = useCallback(
    (md) => {
      setMarkdown(md);
      lint(md);
      // Track dirty state
      if (savedContentRef.current && md !== savedContentRef.current) {
        setIsDirty(true);
      }
    },
    [lint]
  );

  // File Operations
  const handleOpen = useCallback(async () => {
    try {
      const result = await openFile();
      if (result) {
        setFilePath(result.path);
        savedContentRef.current = result.content;
        setExternalContent(result.content);
        setIsDirty(false);
      }
    } catch (err) {
      console.error('Failed to open file:', err);
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      const currentContent = editorInstanceRef.current?.getMarkdown?.() || markdown;
      if (filePath) {
        await saveFile(filePath, currentContent);
        savedContentRef.current = currentContent;
        setIsDirty(false);
      } else {
        const savedPath = await saveFileAs(currentContent);
        if (savedPath) {
          setFilePath(savedPath);
          savedContentRef.current = currentContent;
          setIsDirty(false);
        }
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [filePath, markdown]);

  const handleSaveAs = useCallback(async () => {
    try {
      const currentContent = editorInstanceRef.current?.getMarkdown?.() || markdown;
      const savedPath = await saveFileAs(currentContent);
      if (savedPath) {
        setFilePath(savedPath);
        savedContentRef.current = currentContent;
        setIsDirty(false);
      }
    } catch (err) {
      console.error('Failed to save file:', err);
    }
  }, [markdown]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e) => {
      const isMod = e.ctrlKey || e.metaKey;

      if (isMod && e.key === 'o') {
        e.preventDefault();
        handleOpen();
      } else if (isMod && e.shiftKey && e.key === 's') {
        e.preventDefault();
        handleSaveAs();
      } else if (isMod && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleOpen, handleSave, handleSaveAs]);

  const showTitleBar = isDesktopApp();

  return (
    <div className="app" data-theme={theme}>
      {showTitleBar && (
        <TitleBar
          filename={getFileName(filePath)}
          isDirty={isDirty}
        />
      )}
      <MilkdownEditor
        theme={theme}
        onMarkdownChange={handleMarkdownChange}
        externalContent={externalContent}
        editorInstanceRef={editorInstanceRef}
      />
      <StatusBar
        theme={theme}
        onToggleTheme={toggleTheme}
        markdown={markdown}
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
