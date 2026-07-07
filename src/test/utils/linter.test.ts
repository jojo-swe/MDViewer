import { describe, it, expect } from 'vitest';
import { lintMarkdown, getAllRules, getStrictnessLabel, STRICTNESS_OPTIONS } from '../../utils/linter';
import type { LintIssue } from '../../types/lint';

describe('linter', () => {
  describe('lintMarkdown', () => {
    it('returns empty result for empty input', () => {
      const result = lintMarkdown('');
      expect(result.issues).toHaveLength(0);
      expect(result.summary).toEqual({ errors: 0, warnings: 0, infos: 0 });
    });

    it('detects heading level jumps (MD001)', () => {
      const md = '# Title\n\n### Jump\n';
      const result = lintMarkdown(md, 'relaxed');
      const md001 = result.issues.find((i: LintIssue) => i.ruleId === 'MD001');
      expect(md001).toBeDefined();
      expect(md001?.line).toBe(3);
      expect(md001?.severity).toBe('error');
    });

    it('does not flag proper heading increments', () => {
      const md = '# Title\n\n## Subtitle\n\n### Section\n';
      const result = lintMarkdown(md, 'relaxed');
      const md001 = result.issues.find((i: LintIssue) => i.ruleId === 'MD001');
      expect(md001).toBeUndefined();
    });

    it('detects inconsistent list markers (MD004) at standard level', () => {
      const md = '- item one\n* item two\n';
      const result = lintMarkdown(md, 'standard');
      const md004 = result.issues.find((i: LintIssue) => i.ruleId === 'MD004');
      expect(md004).toBeDefined();
    });

    it('does not flag list style at relaxed level', () => {
      const md = '- item one\n* item two\n';
      const result = lintMarkdown(md, 'relaxed');
      const md004 = result.issues.find((i: LintIssue) => i.ruleId === 'MD004');
      expect(md004).toBeUndefined();
    });

    it('detects trailing whitespace (MD009)', () => {
      const md = 'Hello world   \n';
      const result = lintMarkdown(md, 'strict');
      const md009 = result.issues.find((i: LintIssue) => i.ruleId === 'MD009');
      expect(md009).toBeDefined();
    });

    it('counts summary correctly', () => {
      const md = '# Title\n\n### Jump\n\nHello   \n';
      const result = lintMarkdown(md, 'relaxed');
      expect(result.summary.errors).toBeGreaterThan(0);
    });

    it('respects strictness levels - strict catches more than relaxed', () => {
      const md = '# Title\n\n## Sub\n\nSome text\n\n- item\n* item\n';
      const relaxedResult = lintMarkdown(md, 'relaxed');
      const strictResult = lintMarkdown(md, 'strict');
      expect(strictResult.issues.length).toBeGreaterThanOrEqual(relaxedResult.issues.length);
    });

    it('uses standard strictness by default', () => {
      const md = '- item\n* item\n';
      const defaultResult = lintMarkdown(md);
      const standardResult = lintMarkdown(md, 'standard');
      expect(defaultResult.issues.length).toBe(standardResult.issues.length);
    });
  });

  describe('getAllRules', () => {
    it('returns all rules with metadata', () => {
      const rules = getAllRules();
      expect(rules.length).toBeGreaterThan(5);
      expect(rules[0]).toHaveProperty('id');
      expect(rules[0]).toHaveProperty('name');
      expect(rules[0]).toHaveProperty('description');
      expect(rules[0]).toHaveProperty('level');
      expect(rules[0]).toHaveProperty('severity');
    });
  });

  describe('getStrictnessLabel', () => {
    it('returns correct labels', () => {
      expect(getStrictnessLabel('relaxed')).toBe('Relaxed');
      expect(getStrictnessLabel('standard')).toBe('Standard');
      expect(getStrictnessLabel('strict')).toBe('Strict');
    });

    it('returns Standard for unknown level', () => {
      expect(getStrictnessLabel('unknown' as never)).toBe('Standard');
    });
  });

  describe('STRICTNESS_OPTIONS', () => {
    it('has 3 options', () => {
      expect(STRICTNESS_OPTIONS).toHaveLength(3);
    });

    it('each option has value, label, description, and ruleCount', () => {
      for (const opt of STRICTNESS_OPTIONS) {
        expect(opt).toHaveProperty('value');
        expect(opt).toHaveProperty('label');
        expect(opt).toHaveProperty('description');
        expect(opt).toHaveProperty('ruleCount');
        expect(opt.ruleCount).toBeGreaterThan(0);
      }
    });

    it('strict has more rules than relaxed', () => {
      const relaxed = STRICTNESS_OPTIONS.find((o) => o.value === 'relaxed')!;
      const strict = STRICTNESS_OPTIONS.find((o) => o.value === 'strict')!;
      expect(strict.ruleCount).toBeGreaterThan(relaxed.ruleCount);
    });
  });
});
