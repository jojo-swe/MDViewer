import { useState, useCallback, useRef, useEffect } from 'react';
import { lintMarkdown } from '../utils/linter';

/**
 * Hook to manage markdown linting with debouncing.
 */
export function useLinter(initialStrictness = 'standard') {
  const [strictness, setStrictness] = useState(() => {
    return localStorage.getItem('mdviewer-lint-strictness') || initialStrictness;
  });
  const [results, setResults] = useState({ issues: [], summary: { errors: 0, warnings: 0, infos: 0 } });
  const [enabled, setEnabled] = useState(() => {
    const saved = localStorage.getItem('mdviewer-lint-enabled');
    return saved !== null ? saved === 'true' : true;
  });
  const debounceRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('mdviewer-lint-strictness', strictness);
  }, [strictness]);

  useEffect(() => {
    localStorage.setItem('mdviewer-lint-enabled', String(enabled));
  }, [enabled]);

  const lint = useCallback(
    (markdown) => {
      if (!enabled) {
        setResults({ issues: [], summary: { errors: 0, warnings: 0, infos: 0 } });
        return;
      }
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        const result = lintMarkdown(markdown, strictness);
        setResults(result);
      }, 400);
    },
    [strictness, enabled]
  );

  const toggleEnabled = useCallback(() => {
    setEnabled((prev) => !prev);
  }, []);

  return {
    strictness,
    setStrictness,
    results,
    lint,
    enabled,
    toggleEnabled,
  };
}
