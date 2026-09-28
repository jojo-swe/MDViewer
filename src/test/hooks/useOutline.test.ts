import { describe, it, expect } from 'vitest';
import { parseHeadings } from '../../hooks/useOutline';

describe('useOutline', () => {
  describe('parseHeadings', () => {
    it('extracts headings from markdown', () => {
      const md = '# Title\n## Subtitle\n### Section';
      const headings = parseHeadings(md);
      expect(headings).toHaveLength(3);
      expect(headings[0].level).toBe(1);
      expect(headings[0].text).toBe('Title');
      expect(headings[1].level).toBe(2);
      expect(headings[1].text).toBe('Subtitle');
      expect(headings[2].level).toBe(3);
      expect(headings[2].text).toBe('Section');
    });

    it('handles all heading levels 1-6', () => {
      const md = '# H1\n## H2\n### H3\n#### H4\n##### H5\n###### H6';
      const headings = parseHeadings(md);
      expect(headings).toHaveLength(6);
      for (let i = 0; i < 6; i++) {
        expect(headings[i].level).toBe(i + 1);
      }
    });

    it('ignores non-heading lines', () => {
      const md = 'Some text\n# Heading\nMore text\nNot a heading';
      const headings = parseHeadings(md);
      expect(headings).toHaveLength(1);
      expect(headings[0].text).toBe('Heading');
    });

    it('ignores lines that just start with # without space', () => {
      const md = '#NotAHeading\n# Real Heading';
      const headings = parseHeadings(md);
      expect(headings).toHaveLength(1);
      expect(headings[0].text).toBe('Real Heading');
    });

    it('returns empty array for empty markdown', () => {
      expect(parseHeadings('')).toHaveLength(0);
    });

    it('returns empty array for markdown with no headings', () => {
      expect(parseHeadings('Just some text\nwith no headings')).toHaveLength(0);
    });

    it('tracks line numbers correctly', () => {
      const md = 'Line 0\nLine 1\n# Heading at line 2\nLine 3';
      const headings = parseHeadings(md);
      expect(headings[0].line).toBe(2);
    });

    it('generates unique ids', () => {
      const md = '# Title\n# Title\n# Title';
      const headings = parseHeadings(md);
      expect(headings).toHaveLength(3);
      const ids = headings.map((h) => h.id);
      expect(new Set(ids).size).toBe(3);
    });

    it('trims heading text', () => {
      const md = '#  Spaced Heading  ';
      const headings = parseHeadings(md);
      expect(headings[0].text).toBe('Spaced Heading');
    });
  });
});
