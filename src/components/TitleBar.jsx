import { useState, useEffect } from 'react';
import { getCurrentWindow } from '@tauri-apps/api/window';
import { Minus, Square, X, Copy } from 'lucide-react';
import './TitleBar.css';

export default function TitleBar({ filename, isDirty }) {
  const [isMaximized, setIsMaximized] = useState(false);
  const appWindow = getCurrentWindow();

  useEffect(() => {
    const checkMaximized = async () => {
      try {
        const maximized = await appWindow.isMaximized();
        setIsMaximized(maximized);
      } catch {
        // Not in Tauri environment (web dev mode)
      }
    };
    checkMaximized();

    let unlisten;
    const setupListener = async () => {
      try {
        unlisten = await appWindow.onResized(() => {
          checkMaximized();
        });
      } catch {
        // Not in Tauri environment
      }
    };
    setupListener();

    return () => {
      if (unlisten) unlisten();
    };
  }, [appWindow]);

  const handleMinimize = () => {
    try { appWindow.minimize(); } catch (error) { void error; }
  };
  const handleMaximize = () => {
    try { appWindow.toggleMaximize(); } catch (error) { void error; }
  };
  const handleClose = () => {
    appWindow.destroy().catch((error) => {
      void error;
    });
  };
  const handleControlsMouseDown = (e) => {
    e.stopPropagation();
  };
  const handleControlClick = (handler) => (e) => {
    e.stopPropagation();
    handler();
  };
  const handleDragStart = (e) => {
    // Double-click toggles maximize
    if (e.detail === 2) {
      handleMaximize();
      return;
    }
    try { appWindow.startDragging(); } catch (error) { void error; }
  };

  const displayName = filename || 'Untitled';
  const title = isDirty ? `● ${displayName}` : displayName;

  return (
    <div className="titlebar" id="titlebar" onMouseDown={handleDragStart}>
      <div className="titlebar-left">
        <div className="titlebar-app-icon">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16v16H4z" />
            <path d="M8 8l4 4 4-4" />
            <path d="M8 16h8" />
          </svg>
        </div>
        <span className="titlebar-brand">MDViewer</span>
      </div>

      <div className="titlebar-center">
        <span className={`titlebar-filename ${isDirty ? 'dirty' : ''}`}>{title}</span>
      </div>

      <div className="titlebar-controls" onMouseDown={handleControlsMouseDown}>
        <button
          className="titlebar-btn titlebar-btn--minimize"
          onClick={handleControlClick(handleMinimize)}
          aria-label="Minimize"
          id="minimize-btn"
        >
          <Minus size={14} />
        </button>
        <button
          className="titlebar-btn titlebar-btn--maximize"
          onClick={handleControlClick(handleMaximize)}
          aria-label={isMaximized ? 'Restore' : 'Maximize'}
          id="maximize-btn"
        >
          {isMaximized ? <Copy size={12} /> : <Square size={12} />}
        </button>
        <button
          className="titlebar-btn titlebar-btn--close"
          onClick={handleControlClick(handleClose)}
          aria-label="Close"
          id="close-btn"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
