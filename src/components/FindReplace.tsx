import { useState, useRef, useEffect, useCallback } from 'react';
import { Search, Replace, X, ChevronDown, ChevronUp } from 'lucide-react';
import './FindReplace.css';

interface FindReplaceProps {
  visible: boolean;
  onClose: () => void;
  containerRef?: React.RefObject<HTMLDivElement | null>;
  onReplace?: (transformFn: (markdown: string) => string) => void;
}

/**
 * Find & Replace panel with CSS Highlight API match highlighting.
 */
export default function FindReplace({ visible, onClose, containerRef, onReplace }: FindReplaceProps) {
  const [editorElement, setEditorElement] = useState<Element | null>(null);
  const [query, setQuery] = useState('');
  const [replacement, setReplacement] = useState('');
  const [showReplace, setShowReplace] = useState(false);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [useRegex, setUseRegex] = useState(false);
  const [matchCount, setMatchCount] = useState(0);
  const [currentMatch, setCurrentMatch] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const matchRangesRef = useRef<Range[]>([]);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
    if (visible && containerRef?.current) {
      const el = containerRef.current.querySelector('.ProseMirror');
      setEditorElement(el);
    }
  }, [visible, containerRef]);

  // Build the search regex from current settings
  const buildPattern = useCallback((): RegExp | null => {
    if (!query) return null;
    try {
      const flags = caseSensitive ? 'g' : 'gi';
      return useRegex
        ? new RegExp(query, flags)
        : new RegExp(query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), flags);
    } catch {
      return null;
    }
  }, [query, caseSensitive, useRegex]);

  // Highlight matches using CSS Highlight API
  const doSearch = useCallback(() => {
    matchRangesRef.current = [];

    if (!query || !editorElement) {
      setMatchCount(0);
      setCurrentMatch(0);
      if (window.CSS?.highlights) {
        CSS.highlights.delete('search-results');
        CSS.highlights.delete('search-current');
      }
      return;
    }

    if (window.CSS?.highlights) {
      CSS.highlights.delete('search-results');
      CSS.highlights.delete('search-current');
    }

    try {
      const treeWalker = document.createTreeWalker(editorElement, NodeFilter.SHOW_TEXT, null);
      const textNodes: Text[] = [];
      let node = treeWalker.nextNode();
      while (node) {
        textNodes.push(node as Text);
        node = treeWalker.nextNode();
      }

      const pattern = buildPattern();
      if (!pattern) { setMatchCount(0); return; }

      const ranges: Range[] = [];
      for (const textNode of textNodes) {
        const text = textNode.textContent || '';
        let match: RegExpExecArray | null;
        pattern.lastIndex = 0;
        while ((match = pattern.exec(text)) !== null) {
          const range = new Range();
          range.setStart(textNode, match.index);
          range.setEnd(textNode, match.index + match[0].length);
          ranges.push(range);
          if (match[0].length === 0) break;
        }
      }

      matchRangesRef.current = ranges;
      setMatchCount(ranges.length);
      setCurrentMatch(ranges.length > 0 ? 1 : 0);

      if (ranges.length > 0 && window.CSS?.highlights) {
        CSS.highlights.set('search-results', new Highlight(...ranges));

        // Highlight current match
        const currentRange = ranges[0];
        if (currentRange) {
          CSS.highlights.set('search-current', new Highlight(currentRange));
          currentRange.startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }
      }
    } catch (err) {
      console.error('Search error:', err);
    }
  }, [query, caseSensitive, useRegex, editorElement, buildPattern]);

  useEffect(() => {
    const timer = setTimeout(doSearch, 200);
    return () => clearTimeout(timer);
  }, [doSearch]);

  // Clean up on close
  useEffect(() => {
    if (!visible && window.CSS?.highlights) {
      CSS.highlights.delete('search-results');
      CSS.highlights.delete('search-current');
    }
  }, [visible]);

  // Navigate between matches
  const goToMatch = useCallback((index: number) => {
    const ranges = matchRangesRef.current;
    if (ranges.length === 0) return;
    const i = ((index - 1) % ranges.length + ranges.length) % ranges.length;
    setCurrentMatch(i + 1);
    if (window.CSS?.highlights && ranges[i]) {
      CSS.highlights.set('search-current', new Highlight(ranges[i]));
      ranges[i].startContainer.parentElement?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, []);

  // Replace: use the onReplace callback to do a string replace in the markdown source
  const handleReplace = useCallback(() => {
    if (!query || !onReplace) return;
    onReplace((markdown: string) => {
      const pattern = buildPattern();
      if (!pattern) return markdown;
      // Replace only the first occurrence
      pattern.lastIndex = 0;
      const match = pattern.exec(markdown);
      if (!match) return markdown;
      return markdown.substring(0, match.index) + replacement + markdown.substring(match.index + match[0].length);
    });
  }, [query, replacement, buildPattern, onReplace]);

  const handleReplaceAll = useCallback(() => {
    if (!query || !onReplace) return;
    onReplace((markdown: string) => {
      const pattern = buildPattern();
      if (!pattern) return markdown;
      return markdown.replace(pattern, replacement);
    });
  }, [query, replacement, buildPattern, onReplace]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      goToMatch(currentMatch + 1);
    } else if (e.key === 'Enter' && e.shiftKey) {
      e.preventDefault();
      goToMatch(currentMatch - 1);
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
        <button className="find-close" onClick={onClose} title="Close (Esc)">
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
            <button className="find-action-btn" onClick={handleReplace} title="Replace (single)" disabled={matchCount === 0}>
              Replace
            </button>
            <button className="find-action-btn" onClick={handleReplaceAll} title="Replace All" disabled={matchCount === 0}>
              All
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
