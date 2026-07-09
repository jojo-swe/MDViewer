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
  ListTree,
  FolderTree,
} from 'lucide-react';
import './Sidebar.css';
import './Outline.css';
import Outline from './Outline';
import type { Heading } from '../hooks/useOutline';

interface TreeItemData {
  name: string;
  path: string;
  isDir: boolean;
  children?: TreeItemData[] | null;
}

// Dynamically import Tauri FS for folder reading
let tauriFs: typeof import('@tauri-apps/plugin-fs') | null = null;
let tauriDialog: typeof import('@tauri-apps/plugin-dialog') | null = null;

async function ensureTauri(): Promise<boolean> {
  if (tauriFs) return true;
  try {
    tauriFs = await import('@tauri-apps/plugin-fs');
    tauriDialog = await import('@tauri-apps/plugin-dialog');
    return true;
  } catch {
    return false;
  }
}

async function readDirRecursive(path: string, depth: number = 0, maxDepth: number = 4): Promise<TreeItemData[]> {
  if (depth > maxDepth) return [];
  try {
    if (!tauriFs) return [];
    const entries = await tauriFs.readDir(path);
    const items: TreeItemData[] = [];

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

interface TreeItemProps {
  item: TreeItemData;
  onFileClick: (path: string) => void;
  level?: number;
}

function TreeItem({ item, onFileClick, level = 0 }: TreeItemProps) {
  const [expanded, setExpanded] = useState(false);
  const [children, setChildren] = useState<TreeItemData[] | null>(null);
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

export type SidebarMode = 'explorer' | 'outline';

interface SidebarProps {
  visible: boolean;
  onClose: () => void;
  onFileOpen: (path: string, content: string) => void;
  mode: SidebarMode;
  onModeChange: (mode: SidebarMode) => void;
  headings: Heading[];
  activeHeadingId: string | null;
  onHeadingClick: (heading: Heading) => void;
}

export default function Sidebar({ visible, onClose, onFileOpen, mode, onModeChange, headings, activeHeadingId, onHeadingClick }: SidebarProps) {
  const [rootPath, setRootPath] = useState<string | null>(null);
  const [rootName, setRootName] = useState('');
  const [tree, setTree] = useState<TreeItemData[]>([]);
  const [loading, setLoading] = useState(false);

  const openFolder = useCallback(async () => {
    const hasTauri = await ensureTauri();
    if (!hasTauri || !tauriDialog) return;

    const selected = await tauriDialog.open({
      title: 'Open Folder',
      directory: true,
    });
    if (!selected) return;

    const selectedPath = selected as string;
    setRootPath(selectedPath);
    setRootName(selectedPath.split(/[\\/]/).pop() || '');
    setLoading(true);
    const items = await readDirRecursive(selectedPath);
    setTree(items);
    setLoading(false);
  }, []);

  const handleFileClick = useCallback(
    async (filePath: string) => {
      const hasTauri = await ensureTauri();
      if (!hasTauri || !tauriFs) return;
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
      <div className="sidebar-mode-tabs">
        <button
          className={`sidebar-mode-tab ${mode === 'explorer' ? 'sidebar-mode-tab--active' : ''}`}
          onClick={() => onModeChange('explorer')}
        >
          <FolderTree size={12} />
          Explorer
        </button>
        <button
          className={`sidebar-mode-tab ${mode === 'outline' ? 'sidebar-mode-tab--active' : ''}`}
          onClick={() => onModeChange('outline')}
        >
          <ListTree size={12} />
          Outline
        </button>
        <button className="sidebar-mode-tab" onClick={onClose} title="Close Sidebar" style={{ flex: '0 0 auto' }}>
          <X size={12} />
        </button>
      </div>

      {mode === 'explorer' && (
        <>
          <div className="sidebar-header">
            <span className="sidebar-title">Explorer</span>
            <div className="sidebar-actions">
              <button className="sidebar-action-btn" onClick={openFolder} title="Open Folder">
                <FolderPlus size={14} />
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
        </>
      )}

      {mode === 'outline' && (
        <div className="sidebar-body">
          <div className="sidebar-header">
            <span className="sidebar-title">Outline</span>
          </div>
          <Outline
            headings={headings}
            activeId={activeHeadingId}
            onHeadingClick={onHeadingClick}
          />
        </div>
      )}
    </div>
  );
}
