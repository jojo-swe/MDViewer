import katex from 'katex';
import 'katex/dist/katex.min.css';

export function renderMath(latex: string, displayMode: boolean): string {
  try {
    return katex.renderToString(latex, {
      displayMode,
      throwOnError: false,
      errorColor: '#f59e0b',
      strict: false,
    });
  } catch {
    return `<span class="math-error">${latex}</span>`;
  }
}

export function renderMathBlocks(container: HTMLElement): void {
  // Render inline math: elements with class 'math-inline' or data attribute
  container.querySelectorAll<HTMLElement>('[data-math-inline]').forEach((el) => {
    const latex = el.getAttribute('data-math-inline') || '';
    el.innerHTML = renderMath(latex, false);
    el.removeAttribute('data-math-inline');
    el.classList.add('katex-rendered');
  });

  // Render display math: elements with class 'math-display' or data attribute
  container.querySelectorAll<HTMLElement>('[data-math-display]').forEach((el) => {
    const latex = el.getAttribute('data-math-display') || '';
    el.innerHTML = renderMath(latex, true);
    el.removeAttribute('data-math-display');
    el.classList.add('katex-rendered');
  });
}
