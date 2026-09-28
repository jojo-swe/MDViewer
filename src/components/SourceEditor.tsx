import { useRef, useEffect, useCallback, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import markdownLang from 'highlight.js/lib/languages/markdown';
import './SourceEditor.css';

hljs.registerLanguage('markdown', markdownLang);

// A <pre> doesn't render a trailing empty line the way a textarea does; pad it so
// both layers have the same scroll height and stay aligned at the end of the file.
function highlightMarkdown(text: string): string {
  const padded = text.endsWith('\n') ? text + ' ' : text;
  return hljs.highlight(padded, { language: 'markdown' }).value;
}

interface SourceEditorProps {
  value: string;
  onChange: (value: string) => void;
  fontSize?: number;
  wordWrap?: boolean;
  onCursorChange?: (line: number, col: number) => void;
  onSelectionChange?: (length: number) => void;
}

/**
 * Raw markdown source editor with monospace styling, line numbers, tab support,
 * and syntax highlighting via a highlight.js overlay.
 */
export default function SourceEditor({ value, onChange, fontSize, wordWrap, onCursorChange, onSelectionChange }: SourceEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const lineNumbersRef = useRef<HTMLDivElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [highlightedHtml, setHighlightedHtml] = useState(() => highlightMarkdown(value || ''));

  const lineCount = (value || '').split('\n').length;

  // Debounced syntax highlighting — 50ms so typing is never blocked
  useEffect(() => {
    const timer = setTimeout(() => {
      setHighlightedHtml(highlightMarkdown(value || ''));
    }, 50);
    return () => clearTimeout(timer);
  }, [value]);

  // Sync scroll between line numbers, highlight pre, and textarea
  const handleScroll = useCallback(() => {
    if (lineNumbersRef.current && textareaRef.current) {
      lineNumbersRef.current.scrollTop = textareaRef.current.scrollTop;
    }
    if (preRef.current && textareaRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
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
  const textStyle: React.CSSProperties | undefined = fontSize
    ? { fontSize: `${fontSize}px`, lineHeight: `${lineheight}px` }
    : undefined;

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
      <div className="source-textarea-wrapper">
        <pre
          ref={preRef}
          className={`source-highlight${wordWrap ? ' source-highlight--wrap' : ''}`}
          aria-hidden="true"
          style={textStyle}
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
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
          style={textStyle}
        />
      </div>
    </div>
  );
}
