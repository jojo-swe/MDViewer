import { describe, it, expect } from 'vitest';
import { renderMath } from '../../utils/mathRenderer';

describe('mathRenderer', () => {
  describe('renderMath', () => {
    it('renders simple inline math to HTML', () => {
      const result = renderMath('x^2', false);
      expect(result).toContain('katex');
      expect(result).toContain('x');
    });

    it('renders display mode math', () => {
      const result = renderMath('\\frac{1}{2}', true);
      expect(result).toContain('katex-display');
      expect(result).toContain('frac');
    });

    it('renders inline mode math (no katex-display class)', () => {
      const result = renderMath('a + b', false);
      expect(result).toContain('katex');
      expect(result).not.toContain('katex-display');
    });

    it('handles invalid LaTeX gracefully (throwOnError: false)', () => {
      const result = renderMath('\\invalidcommand{', false);
      // Should not throw, should return some HTML with error color
      expect(result).toContain('katex');
    });

    it('renders complex expressions', () => {
      const result = renderMath('\\sum_{i=1}^{n} x_i', true);
      expect(result).toContain('katex');
      expect(result).toContain('sum');
    });
  });
});
