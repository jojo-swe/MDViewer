import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import SourceEditor from '../../components/SourceEditor';

describe('SourceEditor', () => {
  it('renders the syntax highlight layer on first render', () => {
    const { container } = render(<SourceEditor value={'# Title\n\n**bold**'} onChange={vi.fn()} />);
    const pre = container.querySelector('pre.source-highlight');
    expect(pre).not.toBeNull();
    expect(pre?.querySelector('.hljs-section')?.textContent).toBe('# Title');
    expect(pre?.querySelector('.hljs-strong')?.textContent).toBe('**bold**');
  });

  it('pads a trailing newline so the highlight layer keeps the empty last line', () => {
    const { container } = render(<SourceEditor value={'line\n'} onChange={vi.fn()} />);
    expect(container.querySelector('pre.source-highlight')?.textContent).toBe('line\n ');
  });

  it('applies the word-wrap class to both layers', () => {
    const { container } = render(<SourceEditor value="text" onChange={vi.fn()} wordWrap />);
    expect(container.querySelector('.source-highlight--wrap')).not.toBeNull();
    expect(container.querySelector('.source-textarea--wrap')).not.toBeNull();
  });
});
