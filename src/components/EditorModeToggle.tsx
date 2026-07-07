import { Eye, Code, Columns2 } from 'lucide-react';
import type { EditorMode } from '../types/settings';
import './EditorModeToggle.css';

interface EditorModeToggleProps {
  mode: EditorMode;
  onModeChange: (mode: EditorMode) => void;
}

/**
 * Minimalistic 3-mode toggle inspired by Joplin.
 * Modes: 'wysiwyg' | 'source' | 'split'
 */
export default function EditorModeToggle({ mode, onModeChange }: EditorModeToggleProps) {
  const modes: Array<{ id: EditorMode; icon: React.ReactNode; title: string }> = [
    { id: 'wysiwyg', icon: <Eye size={13} />, title: 'WYSIWYG (Ctrl+Alt+1)' },
    { id: 'source', icon: <Code size={13} />, title: 'Source (Ctrl+Alt+2)' },
    { id: 'split', icon: <Columns2 size={13} />, title: 'Split View (Ctrl+Alt+3)' },
  ];

  return (
    <div className="editor-mode-toggle" id="editor-mode-toggle">
      {modes.map((m) => (
        <button
          key={m.id}
          className={`mode-btn ${mode === m.id ? 'mode-btn--active' : ''}`}
          onClick={() => onModeChange(m.id)}
          title={m.title}
          aria-pressed={mode === m.id}
        >
          {m.icon}
        </button>
      ))}
    </div>
  );
}
