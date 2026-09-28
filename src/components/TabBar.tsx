import { useRef, useState } from 'react';
import { X, Plus, FileText } from 'lucide-react';
import type { Tab } from '../types/tab';
import './TabBar.css';

interface TabBarProps {
  tabs: Tab[];
  activeId: number;
  onSwitch: (id: number) => void;
  onClose: (id: number) => void;
  onNew: () => void;
  onContextMenu?: (e: React.MouseEvent, tab: Tab) => void;
  onReorder?: (fromIdx: number, toIdx: number) => void;
}

export default function TabBar({ tabs, activeId, onSwitch, onClose, onNew, onContextMenu, onReorder }: TabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [dragIndex, setDragIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);

  return (
    <div className="tabbar" id="tabbar">
      <div className="tabbar-scroll" ref={scrollRef}>
        {tabs.map((tab, index) => (
          <button
            key={tab.id}
            className={[
              'tab',
              tab.id === activeId   ? 'tab--active'    : '',
              tab.isDirty           ? 'tab--dirty'     : '',
              dragIndex === index   ? 'tab--dragging'  : '',
              dragOverIndex === index ? 'tab--drag-over' : '',
            ].filter(Boolean).join(' ')}
            onClick={() => onSwitch(tab.id)}
            onContextMenu={onContextMenu ? (e) => onContextMenu(e, tab) : undefined}
            title={tab.path || tab.filename}
            id={`tab-${tab.id}`}
            draggable
            onDragStart={(e) => {
              setDragIndex(index);
              e.dataTransfer.effectAllowed = 'move';
              e.dataTransfer.setData('text/plain', String(index));
            }}
            onDragEnter={(e) => {
              e.preventDefault();
              if (dragIndex !== null && dragOverIndex !== index) {
                setDragOverIndex(index);
              }
            }}
            onDragOver={(e) => {
              e.preventDefault();
              e.dataTransfer.dropEffect = 'move';
            }}
            onDrop={(e) => {
              e.preventDefault();
              if (dragIndex !== null && dragIndex !== index) {
                onReorder?.(dragIndex, index);
              }
              setDragIndex(null);
              setDragOverIndex(null);
            }}
            onDragEnd={() => {
              setDragIndex(null);
              setDragOverIndex(null);
            }}
          >
            <FileText size={13} className="tab-icon" />
            <span className="tab-label">
              {tab.isDirty && <span className="tab-dirty-dot" />}
              {tab.filename}
            </span>
            <span
              className="tab-close"
              onClick={(e) => {
                e.stopPropagation();
                onClose(tab.id);
              }}
              onDragStart={(e) => e.stopPropagation()}
              role="button"
              aria-label={`Close ${tab.filename}`}
            >
              <X size={12} />
            </span>
          </button>
        ))}
      </div>
      <button className="tab-new" onClick={onNew} title="New Tab" id="new-tab-btn">
        <Plus size={14} />
      </button>
    </div>
  );
}
