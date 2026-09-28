import type { ContextMenuItem } from '../hooks/useContextMenu';
import './ContextMenu.css';

interface ContextMenuProps {
  visible: boolean;
  x: number;
  y: number;
  items: ContextMenuItem[];
  menuRef: React.RefObject<HTMLDivElement | null>;
  onItemClick: (item: ContextMenuItem) => void;
}

export default function ContextMenu({ visible, x, y, items, menuRef, onItemClick }: ContextMenuProps) {
  if (!visible) return null;

  return (
    <div
      className="context-menu"
      ref={menuRef}
      style={{ left: x, top: y }}
      role="menu"
    >
      {items.map((item) => {
        if (item.separator) {
          return <div key={item.id} className="context-menu-separator" role="separator" />;
        }
        return (
          <button
            key={item.id}
            className={`context-menu-item ${item.danger ? 'danger' : ''} ${item.disabled ? 'disabled' : ''}`}
            role="menuitem"
            disabled={item.disabled}
            onClick={() => {
              if (!item.disabled) {
                onItemClick(item);
              }
            }}
          >
            {item.icon && <span className="context-menu-icon">{item.icon}</span>}
            <span className="context-menu-label">{item.label}</span>
          </button>
        );
      })}
    </div>
  );
}
