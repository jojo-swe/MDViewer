import { useState, useEffect, useCallback, useRef, useMemo } from 'react';

export interface Heading {
  id: string;
  level: number;
  text: string;
  line: number;
}

const HEADING_RE = /^(#{1,6})\s+(.+)$/;

export function parseHeadings(markdown: string): Heading[] {
  const lines = markdown.split('\n');
  const headings: Heading[] = [];

  for (let i = 0; i < lines.length; i++) {
    const match = HEADING_RE.exec(lines[i]);
    if (match) {
      const level = match[1].length;
      const text = match[2].trim();
      const id = `heading-${headings.length}-${text.toLowerCase().replace(/[^a-z0-9]+/g, '-')}`;
      headings.push({ id, level, text, line: i });
    }
  }

  return headings;
}

export function useOutline(markdown: string) {
  const headings = useMemo(() => parseHeadings(markdown), [markdown]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const containerRef = useRef<HTMLElement | null>(null);

  const scrollToHeading = useCallback((heading: Heading) => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const headingEls = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
    for (const el of headingEls) {
      if (el.textContent?.trim() === heading.text) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        setActiveId(heading.id);
        return;
      }
    }
  }, []);

  const setContainer = useCallback((el: HTMLElement | null) => {
    containerRef.current = el;
  }, []);

  // Track active heading based on scroll
  useEffect(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;

    const handleScroll = () => {
      const headingEls = container.querySelectorAll('h1, h2, h3, h4, h5, h6');
      let active: Element | null = null;
      const containerRect = container.getBoundingClientRect();

      for (const el of headingEls) {
        const rect = el.getBoundingClientRect();
        if (rect.top <= containerRect.top + 40) {
          active = el;
        } else {
          break;
        }
      }

      if (active) {
        const text = active.textContent?.trim() || '';
        const match = headings.find((h) => h.text === text);
        if (match) setActiveId(match.id);
      }
    };

    container.addEventListener('scroll', handleScroll);
    return () => container.removeEventListener('scroll', handleScroll);
  }, [headings]);

  return { headings, activeId, scrollToHeading, setContainer };
}
