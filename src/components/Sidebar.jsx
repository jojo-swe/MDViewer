import { useState, useCallback } from 'react';
import {
  FolderOpen,
  FolderClosed,
  FileText,
  ChevronRight,
  ChevronDown,
  RefreshCw,
  FolderPlus,
  X,
} from 'lucide-react';
import './Sidebar.css';

// Dynamically import Tauri FS for folder reading
let tauriFs = null;
let tauriDialog = null;

async function ensureTauri() {
  if (tauriFs) return true;
  try {
    tauriFs = await import('@tauri-apps/plugin-fs');
    tauriDialog = await import('@tauri-apps/plugin-dialog');
    return true;
  } catch {
    return false;
  }
}

async function readDirRecursive(path, depth = 0, maxDepth = 4) {
  if (depth > maxDepth) return [];
  try {
    const entries = await tauriFs.readDir(path);
    const items = [];

    for (const entry of entries) {
      const fullPath = `${path}/${entry.name}`;
      if (entry.name.startsWith('.') || entry.name === 'node_modules' || entry.name === 'target') {
        continue; // Skip hidden dirs and heavy folders
      }

      if (entry.isDirectory) {
        items.push({
          name: entry.name,
          path: fullPath,
          isDir: true,
          children: null, // Lazy load
        });
      } else if (/\.(md|markdown|mdown|mkd|mdx|txt)$/i.test(entry.name)) {
        items.push({
          name: entry.name,
          path: fullPath,
          isDir: false,
        });
      }
    }

    // Sort: directories first, then alphabetical
    items.sort((a, b) => {
      if (a.isDir !== b.isDir) return a.isDir ? -1 : 1;
      return a.name.localeCompare(b.name);
    });

    return items;
  } catch {
    return [];
  }
}

function TreeItem({ item, onFileClick, level = 0 }) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState(null);
  const [loading, setLoading] = useState(false);

  const toggle = async () => {
    if (!item.isDir) {
      onFileClick(item.path);
      return;
    }

    if (!expanded && children === null) {
      setLoading(true);
      const kids = await readDirRecursive(item.path, 0, 2);
      setChildren(kids);
      setLoading(false);
    }
    setExpanded(!expanded);
  };

  return (
    <div className="tree-item-wrapper">
      <button
        className={`tree-item ${item.isDir ? 'tree-item--dir' : 'tree-item--file'}`}
        style={{ paddingLeft: `${12 + level * 16}px` }}
        onClick={toggle}
        title={item.path}
      >
        {item.isDir ? (
          <>
            {expanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
            {expanded ? <FolderOpen size={14} /> : <FolderClosed size={14} />}
          </>
        ) : (
          <>
            <span style={{ width: 12 }} />
            <FileText size={14} />
          </>
        )}
        <span className="tree-item-label">{item.name}</span>
        {loading && <RefreshCw size={11} className="tree-item-spinner" />}
      </button>

      {expanded && children && (
        <div className="tree-children">
          {children.map((child) => (
            <TreeItem
              key={child.path}
              item={child}
              onFileClick={onFileClick}
              level={level + 1}
            />
          ))}
          {children.length === 0 && (
            <span className="tree-empty" style={{ paddingLeft: `${28 + level * 16}px` }}>
              No markdown files
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function Sidebar({ visible, onClose, onFileOpen }) {
  const [rootPath, setRootPath] = useState(null);
  const [rootName, setRootName] = useState('');
  const [tree, setTree] = useState([]);
  const [loading, setLoading] = useState(false);

  const openFolder = useCallback(async () => {
    const hasTauri = await ensureTauri();
    if (!hasTauri) return;

    const selected = await tauriDialog.open({
      title: 'Open Folder',
      directory: true,
    });
    if (!selected) return;

    setRootPath(selected);
    setRootName(selected.split(/[\\/]/).pop());
    setLoading(true);
    const items = await readDirRecursive(selected);
    setTree(items);
    setLoading(false);
  }, []);

  const handleFileClick = useCallback(
    async (filePath) => {
      const hasTauri = await ensureTauri();
      if (!hasTauri) return;
      try {
        const content = await tauriFs.readTextFile(filePath);
        onFileOpen(filePath, content);
      } catch (err) {
        console.error('Failed to read file:', err);
      }
    },
    [onFileOpen]
  );

  if (!visible) return null;

  return (
    <div className="sidebar" id="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Explorer</span>
        <div className="sidebar-actions">
          <button className="sidebar-action-btn" onClick={openFolder} title="Open Folder">
            <FolderPlus size={14} />
          </button>
          <button className="sidebar-action-btn" onClick={onClose} title="Close Sidebar">
            <X size={14} />
          </button>
        </div>
      </div>

      <div className="sidebar-body">
        {!rootPath ? (
          <div className="sidebar-empty">
            <FolderOpen size={28} />
            <span>No folder opened</span>
            <button className="sidebar-open-btn" onClick={openFolder}>
              Open Folder
            </button>
          </div>
        ) : (
          <>
            <div className="sidebar-root-label">
              <FolderOpen size={13} />
              <span>{rootName}</span>
            </div>
            <div className="sidebar-tree">
              {loading ? (
                <div className="sidebar-loading">
                  <RefreshCw size={14} className="tree-item-spinner" />
                  Loading...
                </div>
              ) : tree.length === 0 ? (
                <div className="sidebar-empty-tree">No markdown files found</div>
              ) : (
                tree.map((item) => (
                  <TreeItem
                    key={item.path}
                    item={item}
                    onFileClick={handleFileClick}
                  />
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
