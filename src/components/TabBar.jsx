import { useRef, useState } from 'react';
import { X, Plus, FileText } from 'lucide-react';
import './TabBar.css';

export default function TabBar({ tabs, activeId, onSwitch, onClose, onNew, onReorder }) {
  const scrollRef = useRef(null);
  const [dragIndex, setDragIndex] = useState(null);
  const [dragOverIndex, setDragOverIndex] = useState(null);

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
                onReorder(dragIndex, index);
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
