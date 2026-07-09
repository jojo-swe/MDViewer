import { useRef, useEffect, useCallback } from 'react';
import './SourceEditor.css';

interface SourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  fontSize?: number;
  wordWrap?: boolean;
  onCursorChange?: (line: number, col: number) => void;
  onSelectionChange?: (length: number) => void;
}

/**
 * Raw markdown source editor with monospace styling, line numbers, and tab support.
 */
export default function SourceEditor({ value, onChange, fontSize, wordWrap, onCursorChange, onSelectionChange }: SourceEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);

  const lineCount = (value || '').split('\n').length;

  // Sync scroll between line numbers and textarea
  const handleScroll = useCallback(() => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
  }, []);

  // Report cursor position and selection
  const reportCursor = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const pos = textarea.selectionStart;
    const before = value.substring(0, pos);
    const line = before.split('\n').length;
    const col = pos - (before.lastIndexOf('\n') + 1) + 1;
    onCursorChange?.(line, col);
    const selLen = textarea.selectionEnd - textarea.selectionStart;
    onSelectionChange?.(selLen);
  }, [value, onCursorChange, onSelectionChange]);

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

  const editorStyle: React.CSSProperties = fontSize
    ? { fontSize: `${fontSize}px` }
    : {};

  const lineheight = fontSize ? fontSize * 1.65 : undefined;

  return (
    <div
      className={`source-editor${wordWrap ? ' source-editor--wrap' : ''}`}
      id="source-editor"
      style={editorStyle}
    >
      <div className="source-line-numbers" ref={lineNumbersRef} aria-hidden="true">
        {Array.from({ length: lineCount }, (_, i) => (
          <span key={i + 1} className="source-line-number">
            {i + 1}
          </span>
        ))}
      </div>
      <textarea
        ref={textareaRef}
        className={`source-textarea${wordWrap ? ' source-textarea--wrap' : ''}`}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        onKeyUp={reportCursor}
        onClick={reportCursor}
        spellCheck={false}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        data-gramm="false"
        id="source-textarea"
        style={fontSize ? { fontSize: `${fontSize}px`, lineHeight: `${lineheight}px` } : undefined}
      />
    </div>
  );
}
