import type { Mermaid } from 'mermaid';

let mermaidInstance: Mermaid | null = null;
let mermaidPromise: Promise<Mermaid> | null = null;
let currentTheme: 'dark' | 'light' = 'light';

export async function loadMermaid(theme: 'dark' | 'light'): Promise<Mermaid> {
  if (mermaidInstance && currentTheme === theme) return mermaidInstance;

  if (mermaidPromise && currentTheme === theme) return mermaidPromise;

  mermaidPromise = import('mermaid').then((m) => {
    const mermaid = m.default;
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict',
    });
    mermaidInstance = mermaid;
    currentTheme = theme;
    return mermaid;
  });

  return mermaidPromise;
}

export async function renderMermaid(
  code: string,
  id: string,
  theme: 'dark' | 'light'
): Promise<string> {
  const mermaid = await loadMermaid(theme);

  // Re-initialize if theme changed
  if (currentTheme !== theme) {
    mermaid.initialize({
      startOnLoad: false,
      theme: theme === 'dark' ? 'dark' : 'default',
      securityLevel: 'strict',
    });
    currentTheme = theme;
  }

  const { svg } = await mermaid.render(id, code);
  return svg;
}

export function hasMermaidBlocks(container: HTMLElement): boolean {
  return container.querySelectorAll('pre code.language-mermaid').length > 0;
}
