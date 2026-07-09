import { useRef } from 'react';
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
}

export default function TabBar({ tabs, activeId, onSwitch, onClose, onNew, onContextMenu }: TabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  return (
    <div className="tabbar" id="tabbar">
      <div className="tabbar-scroll" ref={scrollRef}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${tab.id === activeId ? 'tab--active' : ''} ${tab.isDirty ? 'tab--dirty' : ''}`}
            onClick={() => onSwitch(tab.id)}
            onContextMenu={onContextMenu ? (e) => onContextMenu(e, tab) : undefined}
            title={tab.path || tab.filename}
            id={`tab-${tab.id}`}
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
