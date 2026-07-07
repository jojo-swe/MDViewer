import { useRef, useEffect, useCallback } from 'react';
import './SourceEditor.css';

interface SourceEditorProps {
  value: string;
  onChange: (value: string) => void;
}

/**
 * Raw markdown source editor with monospace styling, line numbers, and tab support.
 */
export default function SourceEditor({ value, onChange }: SourceEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lineCount = (value || '').split('\n').length;

  // Sync scroll between line numbers and textarea
  const handleScroll = useCallback(() => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Handle Tab key for indentation instead of focus change
  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = textareaRef.current;
        if (!textarea) return;
        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const newValue = value.substring(0, start) + '  ' + value.substring(end);
        onChange(newValue);
        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = start + 2;
        });
      }
    },
    [value, onChange]
  );

  // Auto-resize and scroll sync on mount
  useEffect(() => {
    const el = textareaRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
    }
    return () => {
      el?.removeEventListener('scroll', handleScroll);
    };
  }, [handleScroll]);

  return (
    <div className="source-editor" id="source-editor">
      <div className="source-line-numbers" ref={lineNumbersRef} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i + 1} className="source-line-number">
            {i + 1}
          </span>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className="source-textarea"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        data-gramm="false"
        id="source-textarea"
      />
    </div>
  );
}
