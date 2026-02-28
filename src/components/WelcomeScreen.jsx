import { FileText, Clock, FolderOpen, Plus, Trash2, Keyboard } from 'lucide-react';
import './WelcomeScreen.css';

function formatRelativeTime(timestamp) {
  const diff = Date.now() - timestamp;
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return 'Just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;
  return new Date(timestamp).toLocaleDateString();
}

export default function WelcomeScreen({ recentFiles, onOpenFile, onOpenRecent, onNewFile, onClearRecent }) {
  return (
    <div className="welcome" id="welcome-screen">
      <div className="welcome-content">
        <div className="welcome-logo">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 4h16v16H4z" />
            <path d="M8 8l4 4 4-4" />
            <path d="M8 16h8" />
          </svg>
        </div>
        <h1 className="welcome-title">MDViewer</h1>
        <p className="welcome-subtitle">Powerful. Lightweight. Beautiful.</p>

        <div className="welcome-actions">
          <button className="welcome-action" onClick={onNewFile} id="welcome-new-btn">
            <Plus size={18} />
            <div>
              <span className="welcome-action-label">New Document</span>
              <span className="welcome-action-hint">Ctrl+N</span>
            </div>
          </button>
          <button className="welcome-action" onClick={onOpenFile} id="welcome-open-btn">
            <FolderOpen size={18} />
            <div>
              <span className="welcome-action-label">Open File</span>
              <span className="welcome-action-hint">Ctrl+O</span>
            </div>
          </button>
        </div>

        {recentFiles.length > 0 && (
          <div className="welcome-recent">
            <div className="welcome-recent-header">
              <div className="welcome-recent-title">
                <Clock size={13} />
                <span>Recent Files</span>
              </div>
              <button className="welcome-recent-clear" onClick={onClearRecent} title="Clear recent files">
                <Trash2 size={12} />
                Clear
              </button>
            </div>
            <div className="welcome-recent-list">
              {recentFiles.map((file) => (
                <button
                  key={file.path}
                  className="welcome-recent-item"
                  onClick={() => onOpenRecent(file.path)}
                  title={file.path}
                >
                  <FileText size={14} className="welcome-recent-icon" />
                  <span className="welcome-recent-name">{file.filename}</span>
                  <span className="welcome-recent-time">{formatRelativeTime(file.openedAt)}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="welcome-shortcuts">
          <Keyboard size={12} />
          <span>Ctrl+N new · Ctrl+O open · Ctrl+S save · Ctrl+B sidebar · Ctrl+F find</span>
        </div>
      </div>
    </div>
  );
}
