import { describe, it, expect, vi, beforeEach } from 'vitest';

const mockRender = vi.fn(async (id: string, code: string) => ({
  svg: `<svg id="${id}"><text>${code}</text></svg>`,
}));

const mockInitialize = vi.fn();

vi.mock('mermaid', () => ({
  default: {
    initialize: mockInitialize,
    render: mockRender,
  },
}));

import { loadMermaid, renderMermaid, hasMermaidBlocks } from '../../utils/mermaidRenderer';

describe('mermaidRenderer', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.resetModules();
  });

  describe('loadMermaid', () => {
    it('initializes mermaid with correct theme', async () => {
      await loadMermaid('dark');
      expect(mockInitialize).toHaveBeenCalledWith({
        startOnLoad: false,
        theme: 'dark',
        securityLevel: 'strict',
      });
    });

    it('initializes with default theme for light', async () => {
      await loadMermaid('light');
      expect(mockInitialize).toHaveBeenCalledWith({
        startOnLoad: false,
        theme: 'default',
        securityLevel: 'strict',
      });
    });
  });

  describe('renderMermaid', () => {
    it('returns SVG string from mermaid render', async () => {
      const svg = await renderMermaid('graph TD\n  A --> B', 'test-diagram', 'dark');
      expect(svg).toContain('<svg');
      expect(svg).toContain('test-diagram');
      expect(mockRender).toHaveBeenCalledWith('test-diagram', 'graph TD\n  A --> B');
    });

    it('passes code to mermaid.render', async () => {
      const code = 'sequenceDiagram\n  A->>B: Hello';
      await renderMermaid(code, 'seq-1', 'light');
      expect(mockRender).toHaveBeenCalledWith('seq-1', code);
    });
  });

  describe('hasMermaidBlocks', () => {
    it('returns true when mermaid code blocks exist', () => {
      const container = document.createElement('div');
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.className = 'language-mermaid';
      code.textContent = 'graph TD';
      pre.appendChild(code);
      container.appendChild(pre);
      expect(hasMermaidBlocks(container)).toBe(true);
    });

    it('returns false when no mermaid code blocks exist', () => {
      const container = document.createElement('div');
      const pre = document.createElement('pre');
      const code = document.createElement('code');
      code.className = 'language-javascript';
      code.textContent = 'const x = 1;';
      pre.appendChild(code);
      container.appendChild(pre);
      expect(hasMermaidBlocks(container)).toBe(false);
    });

    it('returns false for empty container', () => {
      const container = document.createElement('div');
      expect(hasMermaidBlocks(container)).toBe(false);
    });
  });
});
