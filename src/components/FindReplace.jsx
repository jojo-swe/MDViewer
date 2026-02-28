import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Replace, X, ChevronDown, ChevronUp } from 'lucide-react';
import './FindReplace.css';

export default function FindReplace({ visible, onClose, containerRef }) {
  const [editorElement, setEditorElement] = useState(null);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    // Resolve the ProseMirror element from the container ref
    if (visible && containerRef?.current) {
      const el = containerRef.current.querySelector('.ProseMirror');
      setEditorElement(el);
    }
  }, [visible, containerRef]);

  // Highlight matches in editor using browser's native find
  const doSearch = useCallback(() => {
    if (!query || !editorElement) {
      setMatchCount(0);
      setCurrentMatch(0);
      return;
    }

    // Clear previous highlights
    if (window.CSS && CSS.highlights) {
      CSS.highlights.delete('search-results');
      CSS.highlights.delete('search-current');
    }

    try {
      const treeWalker = document.createTreeWalker(
        editorElement,
        NodeFilter.SHOW_TEXT,
        null
      );

      const textNodes = [];
      let currentNode = treeWalker.nextNode();
      while (currentNode) {
        textNodes.push(currentNode);
        currentNode = treeWalker.nextNode();
      }

      const ranges = [];
      const flags = caseSensitive ? (useRegex ? 'g' : 'g') : (useRegex ? 'gi' : 'gi');

      let searchPattern;
      try {
        searchPattern = useRegex ? new RegExp(query, flags) : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
      } catch {
        setMatchCount(0);
        return;
      }

      for (const node of textNodes) {
        const text = node.textContent;
        let match;
        searchPattern.lastIndex = 0;
        while ((match = searchPattern.exec(text)) !== null) {
          const range = new Range();
          range.setStart(node, match.index);
          range.setEnd(node, match.index + match[0].length);
          ranges.push(range);
          if (match[0].length === 0) break; // Prevent infinite loop
        }
      }

      setMatchCount(ranges.length);
      setCurrentMatch(ranges.length > 0 ? 1 : 0);

      // Use CSS Highlight API if available
      if (ranges.length > 0 && window.CSS && CSS.highlights) {
        const highlight = new Highlight(...ranges);
        CSS.highlights.set('search-results', highlight);

        // Scroll first match into view
        const firstRange = ranges[0];
        const rect = firstRange.getBoundingClientRect();
        if (rect) {
          const container = editorElement.closest('.editor-container');
          if (container) {
            const containerRect = container.getBoundingClientRect();
            if (rect.top < containerRect.top || rect.bottom > containerRect.bottom) {
              firstRange.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
          }
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [query, caseSensitive, useRegex, editorElement]);

  useEffect(() => {
    const timer = setTimeout(doSearch, 200);
    return () => clearTimeout(timer);
  }, [doSearch]);

  // Clean up highlights on close
  useEffect(() => {
    if (!visible && window.CSS && CSS.highlights) {
      CSS.highlights.delete('search-results');
      CSS.highlights.delete('search-current');
    }
  }, [visible]);

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      // Next match
      if (matchCount > 0) {
        setCurrentMatch((prev) => (prev % matchCount) + 1);
      }
    }
  };

  if (!visible) return null;

  return (
    <div className="find-replace" id="find-replace" onKeyDown={handleKeyDown}>
      <div className="find-replace-row">
        <div className="find-input-wrapper">
          <Search size={13} className="find-icon" />
          <input
            ref={inputRef}
            className="find-input"
            type="text"
            placeholder="Find..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            id="find-input"
          />
          {query && (
            <span className="find-count">
              {matchCount > 0 ? `${currentMatch}/${matchCount}` : 'No results'}
            </span>
          )}
        </div>
        <div className="find-toggles">
          <button
            className={`find-toggle ${caseSensitive ? 'active' : ''}`}
            onClick={() => setCaseSensitive(!caseSensitive)}
            title="Case Sensitive"
          >
            Aa
          </button>
          <button
            className={`find-toggle ${useRegex ? 'active' : ''}`}
            onClick={() => setUseRegex(!useRegex)}
            title="Use Regular Expression"
          >
            .*
          </button>
          <button
            className="find-toggle"
            onClick={() => setShowReplace(!showReplace)}
            title={showReplace ? 'Hide Replace' : 'Show Replace'}
          >
            {showReplace ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
        <button className="find-close" onClick={onClose} title="Close">
          <X size={14} />
        </button>
      </div>

      {showReplace && (
        <div className="find-replace-row find-replace-row--replace">
          <div className="find-input-wrapper">
            <Replace size={13} className="find-icon" />
            <input
              className="find-input"
              type="text"
              placeholder="Replace..."
              value={replacement}
              onChange={(e) => setReplacement(e.target.value)}
              id="replace-input"
            />
          </div>
          <div className="find-replace-actions">
            <button className="find-action-btn" title="Replace">
              Replace
            </button>
            <button className="find-action-btn" title="Replace All">
              All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
