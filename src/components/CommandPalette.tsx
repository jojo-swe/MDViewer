import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { Search, CornerDownLeft } from 'lucide-react';
import type { Command, CommandCategory } from '../types/command';
import './CommandPalette.css';

interface CommandPaletteProps {
  visible: boolean;
  commands: Command[];
  onClose: () => void;
  onExecute: (command: Command) => void;
}

const CATEGORY_LABELS: Record<CommandCategory, string> = {
  file: 'File',
  edit: 'Edit',
  view: 'View',
  lint: 'Lint',
  settings: 'Settings',
};

/**
 * Simple fuzzy match — checks if all characters of the query
 * appear in order in the target string (case-insensitive).
 * Returns a score (lower = better match) or -1 if no match.
 */
function fuzzyMatch(query: string, target: string): number {
  const q = query.toLowerCase();
  const t = target.toLowerCase();
  let qi = 0;
  let score = 0;
  let lastMatchPos = -1;

  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) {
      // Prefer consecutive matches
      score += lastMatchPos === ti - 1 ? 0 : 1;
      lastMatchPos = ti;
      qi++;
    }
  }

  return qi === q.length ? score : -1;
}

export default function CommandPalette({ visible, commands, onClose, onExecute }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Reset state when opened
  useEffect(() => {
    if (visible) {
      setQuery('');
      setSelectedIndex(0);
      // Focus input after render
      requestAnimationFrame(() => {
        inputRef.current?.focus();
      });
    }
  }, [visible]);

  // Filter commands by fuzzy search
  const filteredCommands = useMemo(() => {
    if (!query.trim()) return commands;

    const scored = commands
      .map((cmd) => {
        const titleScore = fuzzyMatch(query, cmd.title);
        const categoryScore = fuzzyMatch(query, cmd.category);
        const bestScore = titleScore >= 0 ? titleScore : categoryScore;
        return { cmd, score: bestScore };
      })
      .filter(({ score }) => score >= 0)
      .sort((a, b) => a.score - b.score);

    return scored.map(({ cmd }) => cmd);
  }, [commands, query]);

  // Reset selected index when query changes
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return;
    const selected = listRef.current.children[selectedIndex] as HTMLElement | undefined;
    selected?.scrollIntoView({ block: 'nearest' });
  }, [selectedIndex]);

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      } else if (e.key === 'ArrowDown') {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === 'Enter') {
        e.preventDefault();
        const cmd = filteredCommands[selectedIndex];
        if (cmd) {
          onExecute(cmd);
          onClose();
        }
      }
    },
    [filteredCommands, selectedIndex, onExecute, onClose]
  );

  if (!visible) return null;

  // Group commands by category for display
  const grouped = filteredCommands.reduce<Record<string, Command[]>>((acc, cmd) => {
    const cat = cmd.category;
    if (!acc[cat]) acc[cat] = [];
    acc[cat].push(cmd);
    return acc;
  }, {});

  let flatIndex = 0;

  return (
    <div className="cmd-palette-overlay" onClick={onClose}>
      <div
        className="cmd-palette"
        role="dialog"
        aria-modal="true"
        aria-label="Command Palette"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={handleKeyDown}
        id="command-palette"
      >
        <div className="cmd-palette-input-wrapper">
          <Search size={16} className="cmd-palette-icon" />
          <input
            ref={inputRef}
            className="cmd-palette-input"
            type="text"
            placeholder="Type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoComplete="off"
            spellCheck={false}
          />
          <kbd className="cmd-palette-esc">Esc</kbd>
        </div>

        {filteredCommands.length === 0 ? (
          <div className="cmd-palette-empty">No commands found</div>
        ) : (
          <div className="cmd-palette-list" ref={listRef}>
            {Object.entries(grouped).map(([category, cmds]) => (
              <div key={category} className="cmd-palette-group">
                <div className="cmd-palette-group-label">
                  {CATEGORY_LABELS[category as CommandCategory] || category}
                </div>
                {cmds.map((cmd) => {
                  const idx = flatIndex++;
                  const isSelected = idx === selectedIndex;
                  const Icon = cmd.icon;
                  return (
                    <button
                      key={cmd.id}
                      className={`cmd-palette-item ${isSelected ? 'selected' : ''}`}
                      onMouseEnter={() => setSelectedIndex(idx)}
                      onClick={() => {
                        onExecute(cmd);
                        onClose();
                      }}
                    >
                      <span className="cmd-palette-item-icon">
                        {Icon ? <Icon size={15} /> : null}
                      </span>
                      <span className="cmd-palette-item-title">{cmd.title}</span>
                      {cmd.shortcut && (
                        <kbd className="cmd-palette-item-shortcut">{cmd.shortcut}</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>
        )}

        <div className="cmd-palette-footer">
          <span className="cmd-palette-hint">
            <CornerDownLeft size={11} />
            to select
          </span>
          <span className="cmd-palette-hint">
            <kbd>↑</kbd><kbd>↓</kbd> to navigate
          </span>
        </div>
      </div>
    </div>
  );
}
