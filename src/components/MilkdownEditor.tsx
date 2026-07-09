import { useEffect, useRef, useCallback } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import '@milkdown/crepe/theme/frame-dark.css';
import '@milkdown/crepe/theme/common/latex.css';
import type { Theme } from '../types/settings';
import { highlightCode } from '../utils/highlight';
import { renderMermaid } from '../utils/mermaidRenderer';
import { savePastedImage, isImageClipboardItem } from '../utils/imageManager';
import { getThemeConfig } from '../themes';

const DEFAULT_CONTENT = `# Welcome to MDViewer

A powerful, lightweight, and beautifully crafted Markdown editor.

## Getting Started

Start typing to begin writing your document. MDViewer supports **bold**, *italic*, ~~strikethrough~~, and \`inline code\`.

### Features

- **WYSIWYG Editing** — What you see is what you get
- **Slash Commands** — Type \`/\` to insert blocks quickly
- **Markdown Linting** — Configurable strictness levels
- **Dark & Light Mode** — Seamless theme switching
- **Code Blocks** — Syntax highlighted code editing
- **Tables** — Full-featured table editing
- **LaTeX** — Mathematical formula support

### Code Example

\`\`\`javascript
function greet(name) {
  return \`Hello, \${name}! Welcome to MDViewer.\`;
}

console.log(greet("World"));
\`\`\`

### A Table

| Feature | Status |
|---------|--------|
| WYSIWYG | ✅ Ready |
| Linting | ✅ Ready |
| Dark Mode | ✅ Ready |
| Split View | 🔜 Coming |

> **Tip:** Use the toolbar at the bottom to toggle linting, switch themes, or check your word count.

---

*Happy writing!* ✨
`;

export interface EditorInstance {
  getMarkdown: () => string;
  setContent: (content: string) => void;
}

interface MilkdownEditorProps {
  theme: Theme;
  onMarkdownChange?: (markdown: string) => void;
  externalContent?: string;
  editorInstanceRef?: React.MutableRefObject<EditorInstance | null>;
  fontSize?: number;
  wordWrap?: boolean;
  basePath?: string | null;
}

export default function MilkdownEditor({ theme, onMarkdownChange, externalContent, editorInstanceRef, fontSize, wordWrap, basePath = null }: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const initEditorRef = useRef<((content: string) => Crepe | void) | null>(null);
  const themeRef = useRef<Theme>(theme);
  const highlightCodeBlocksRef = useRef<() => Promise<void>>(async () => {});

  // Keep theme ref in sync for use in async highlighting
  useEffect(() => {
    themeRef.current = theme;
  }, [theme]);

  // --- Shiki syntax highlighting + Mermaid rendering for code blocks ---
  const highlightCodeBlocks = useCallback(async () => {
    if (!editorRef.current) return;
    const codeBlocks = editorRef.current.querySelectorAll<HTMLElement>('pre code');
    if (codeBlocks.length === 0) return;

    const currentTheme = getThemeConfig(themeRef.current).isDark ? 'dark' : 'light';
    const promises = Array.from(codeBlocks).map(async (block, index) => {
      // Skip if already highlighted by Shiki or rendered as Mermaid
      if (block.closest('.shiki') || block.closest('.mermaid-svg')) return;

      const pre = block.parentElement;
      if (!pre) return;

      // Extract language from class name (e.g., "language-javascript")
      const langClass = Array.from(block.classList).find((c) => c.startsWith('language-'));
      const lang = langClass ? langClass.replace('language-', '') : 'markdown';
      const code = block.textContent || '';

      // Handle Mermaid diagrams
      if (lang === 'mermaid') {
        try {
          const svg = await renderMermaid(code, `mermaid-${index}`, currentTheme);
          const wrapper = document.createElement('div');
          wrapper.className = 'mermaid-svg';
          wrapper.innerHTML = svg;
          wrapper.setAttribute('data-mermaid-code', code);
          wrapper.setAttribute('data-mermaid-lang', lang);
          pre.replaceWith(wrapper);
        } catch {
          // Silently skip if mermaid rendering fails
        }
        return;
      }

      // Handle syntax highlighting with Shiki
      try {
        const highlightedHtml = await highlightCode(code, lang, currentTheme);
        // Replace the <pre> element with Shiki's highlighted HTML
        const wrapper = document.createElement('div');
        wrapper.innerHTML = highlightedHtml;
        const highlightedPre = wrapper.firstElementChild as HTMLElement;
        if (highlightedPre) {
          pre.replaceWith(highlightedPre);
        }
      } catch {
        // Silently skip if highlighting fails
      }
    });

    await Promise.all(promises);
  }, []);

  // Keep ref in sync so initEditor can call it
  useEffect(() => {
    highlightCodeBlocksRef.current = highlightCodeBlocks;
  }, [highlightCodeBlocks]);

  const initEditor = useCallback((content: string): Crepe | void => {
    if (!editorRef.current) return;

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: content,
      features: {
        [Crepe.Feature.Latex]: true,
      },
      featureConfigs: {
        [Crepe.Feature.Latex]: {
          katexOptions: {
            throwOnError: false,
            errorColor: '#f59e0b',
            strict: false,
          },
        },
      },
    });

    crepe.on((listener) => {
      listener.markdownUpdated((_ctx, markdown) => {
        if (onMarkdownChange) {
          onMarkdownChange(markdown);
        }
      });
    });

    crepe.create().then(() => {
      crepeRef.current = crepe;
      if (editorInstanceRef) {
        editorInstanceRef.current = {
          getMarkdown: () => crepe.getMarkdown(),
          setContent: (c: string) => {
            if (crepeRef.current) {
              crepeRef.current.destroy();
              crepeRef.current = null;
              initEditorRef.current?.(c);
            }
          },
        };
      }
      if (onMarkdownChange) {
        onMarkdownChange(content);
      }
      // Trigger initial syntax highlighting
      highlightCodeBlocksRef.current();
    });

    return crepe;
  }, [onMarkdownChange, editorInstanceRef]);

  // Keep ref in sync for use in setContent callback
  useEffect(() => {
    initEditorRef.current = initEditor;
  }, [initEditor]);

  // Initialize editor on mount
  useEffect(() => {
    initEditor(DEFAULT_CONTENT);
    return () => {
      if (crepeRef.current) {
        crepeRef.current.destroy();
        crepeRef.current = null;
      }
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Handle external content updates (file open)
  useEffect(() => {
    if (externalContent !== null && externalContent !== undefined && crepeRef.current) {
      crepeRef.current.destroy();
      crepeRef.current = null;
      initEditor(externalContent);
    }
  }, [externalContent]); // eslint-disable-line react-hooks/exhaustive-deps

  // Re-highlight on theme changes
  useEffect(() => {
    if (!crepeRef.current) return;
    // Clear existing Shiki highlights and Mermaid SVGs, restore original code blocks
    if (editorRef.current) {
      // Restore Shiki-highlighted blocks
      editorRef.current.querySelectorAll('.shiki').forEach((el) => {
        const pre = el as HTMLElement;
        const code = pre.querySelector('code');
        if (code) {
          const newPre = document.createElement('pre');
          newPre.appendChild(code.cloneNode(true));
          pre.replaceWith(newPre);
        }
      });
      // Restore Mermaid SVG blocks
      editorRef.current.querySelectorAll('.mermaid-svg').forEach((el) => {
        const wrapper = el as HTMLElement;
        const code = wrapper.getAttribute('data-mermaid-code') || '';
        const lang = wrapper.getAttribute('data-mermaid-lang') || 'mermaid';
        const newPre = document.createElement('pre');
        const newCode = document.createElement('code');
        newCode.className = `language-${lang}`;
        newCode.textContent = code;
        newPre.appendChild(newCode);
        wrapper.replaceWith(newPre);
      });
    }
    highlightCodeBlocks();
  }, [theme, highlightCodeBlocks]);

  // Re-highlight after content changes (debounced)
  const highlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!crepeRef.current) return;
    if (highlightTimerRef.current) {
      clearTimeout(highlightTimerRef.current);
    }
    highlightTimerRef.current = setTimeout(() => {
      highlightCodeBlocks();
    }, 300);
    return () => {
      if (highlightTimerRef.current) {
        clearTimeout(highlightTimerRef.current);
      }
    };
  }, [externalContent, highlightCodeBlocks]);

  // Image paste handler
  useEffect(() => {
    const editorEl = editorRef.current;
    if (!editorEl) return;

    const handlePaste = async (e: ClipboardEvent) => {
      if (!e.clipboardData) return;
      const items = Array.from(e.clipboardData.items);
      const imageItem = items.find(isImageClipboardItem);
      if (!imageItem) return;

      e.preventDefault();
      const blob = imageItem.getAsFile();
      if (!blob) return;

      try {
        const path = await savePastedImage(blob, basePath);
        const imgMarkdown = `![image](${path})`;
        // Insert at cursor by using execCommand as fallback
        document.execCommand('insertText', false, imgMarkdown);
      } catch {
        // Silently skip if image paste fails
      }
    };

    editorEl.addEventListener('paste', handlePaste);
    return () => editorEl.removeEventListener('paste', handlePaste);
  }, [basePath]);

  return (
    <div
      className={`editor-container${wordWrap ? ' editor-container--wrap' : ''}`}
      style={fontSize ? { fontSize: `${fontSize}px` } : undefined}
    >
      <div
        ref={editorRef}
        className="milkdown-wrapper"
        id="milkdown-editor"
      />
    </div>
  );
}
