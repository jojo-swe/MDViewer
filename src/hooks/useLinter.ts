import { useState, useCallback, useRef, useEffect } from 'react';
import { lintMarkdown } from '../utils/linter';
import type { LintResult, StrictnessLevel } from '../types/lint';

interface UseLinterOptions {
  strictness: StrictnessLevel;
  enabled: boolean;
}

/**
 * Hook to manage markdown linting with debouncing.
 * Config (strictness, enabled) is owned by the settings store and passed in.
 */
export function useLinter({ strictness, enabled }: UseLinterOptions) {
  const [results, setResults] = useState<LintResult>({ issues: [], summary: { errors: 0, warnings: 0, infos: 0 } });
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Keep latest values in refs so the lint callback doesn't need to re-create
  const strictnessRef = useRef(strictness);
  const enabledRef = useRef(enabled);

  useEffect(() => {
    strictnessRef.current = strictness;
  }, [strictness]);

  useEffect(() => {
    enabledRef.current = enabled;
  }, [enabled]);

  const lint = useCallback((markdown: string) => {
    if (!enabledRef.current) {
      setResults({ issues: [], summary: { errors: 0, warnings: 0, infos: 0 } });
      return;
    }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const result = lintMarkdown(markdown, strictnessRef.current);
      setResults(result);
    }, 400);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  return { results, lint };
}
