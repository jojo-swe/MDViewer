import { useEffect, useRef, useCallback } from 'react';
import { Crepe } from '@milkdown/crepe';
import '@milkdown/crepe/theme/common/style.css';
import '@milkdown/crepe/theme/frame.css';
import '@milkdown/crepe/theme/frame-dark.css';

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
| Split View | ✅ Ready |

> **Tip:** Use the toolbar at the bottom to toggle linting, switch themes, or check your word count.

---

*Happy writing!* ✨
`;

export default function MilkdownEditor({ theme, onMarkdownChange, externalContent, editorInstanceRef }) {
  const editorRef = useRef(null);
  const crepeRef = useRef(null);

  // Expose setter for external content loading
  const setContent = useCallback((content) => {
    if (crepeRef.current) {
      // Destroy and recreate with new content
      crepeRef.current.destroy();
      crepeRef.current = null;
      initEditor(content);
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const initEditor = useCallback((content) => {
    if (!editorRef.current) return;

    const crepe = new Crepe({
      root: editorRef.current,
      defaultValue: content,
    });

    crepe.on((listener) => {
      listener.markdownUpdated((ctx, markdown) => {
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
          setContent,
        };
      }
      if (onMarkdownChange) {
        onMarkdownChange(content);
      }
    });

    return crepe;
  }, [onMarkdownChange, editorInstanceRef, setContent]);

  // Initialize editor on mount
  useEffect(() => {
    const crepe = initEditor(DEFAULT_CONTENT);
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
