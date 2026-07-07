import { useEffect, useRef, useCallback } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import '@milkdown/crepe/theme/frame-dark.css';
import type { Theme } from '../types/settings';

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
}

export default function MilkdownEditor({ onMarkdownChange, externalContent, editorInstanceRef }: MilkdownEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const crepeRef = useRef<Crepe | null>(null);
  const initEditorRef = useRef<((content: string) => Crepe | void) | null>(null);

  const initEditor = useCallback((content: string): Crepe | void => {
    if (!editorRef.current) return;

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: content,
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

  return (
    <div className="editor-container">
      <div
        ref={editorRef}
        className="milkdown-wrapper"
        id="milkdown-editor"
      />
    </div>
  );
}
