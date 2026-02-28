import { useRef } from 'react';
import { X, Plus, FileText } from 'lucide-react';
import './TabBar.css';

export default function TabBar({ tabs, activeId, onSwitch, onClose, onNew }) {
  const scrollRef = useRef(null);

  return (
    <div className="tabbar" id="tabbar">
      <div className="tabbar-scroll" ref={scrollRef}>
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`tab ${tab.id === activeId ? 'tab--active' : ''} ${tab.isDirty ? 'tab--dirty' : ''}`}
            onClick={() => onSwitch(tab.id)}
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
