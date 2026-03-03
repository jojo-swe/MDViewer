import { useRef, useEffect, useCallback, useState } from 'react';
import hljs from 'highlight.js/lib/core';
import markdownLang from 'highlight.js/lib/languages/markdown';
import './SourceEditor.css';

hljs.registerLanguage('markdown', markdownLang);

/**
 * Raw markdown source editor with monospace styling, line numbers, tab support,
 * and syntax highlighting via a highlight.js overlay.
 * Props: value, onChange
 */
export default function SourceEditor({ value, onChange }) {
  const textareaRef = useRef(null);
  const lineNumbersRef = useRef(null);
  const preRef = useRef(null);
  const [highlightedHtml, setHighlightedHtml] = useState('');

  const lineCount = (value || '').split('\n').length;

  // Debounced syntax highlighting — 50ms so typing is never blocked
  useEffect(() => {
    const timer = setTimeout(() => {
      const { value: html } = hljs.highlight(value || '', { language: 'markdown' });
      setHighlightedHtml(html);
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

  // Handle Tab key for indentation instead of focus change
  const handleKeyDown = useCallback(
    (e) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const textarea = textareaRef.current;
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
      <div className="source-textarea-wrapper">
        <pre
          ref={preRef}
          className="source-highlight"
          aria-hidden="true"
          dangerouslySetInnerHTML={{ __html: highlightedHtml }}
        />
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
    </div>
  );
}
