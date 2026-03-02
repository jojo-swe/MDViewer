# CLAUDE.md — MDViewer

This file provides guidance for AI assistants (Claude and others) working on the MDViewer codebase.

## Project Overview

MDViewer is a cross-platform WYSIWYG Markdown editor built with **React 19 + Vite** on the frontend and **Tauri v2 (Rust)** on the backend. It runs as both a native desktop app (via Tauri) and a browser-only web app (with graceful fallbacks).

**Key characteristics:**
- No build-time CSS preprocessing — all styling is plain CSS with custom properties
- No state management library — state is managed entirely through custom React hooks
- No TypeScript — the project uses plain JavaScript with JSDoc comments
- The Rust backend has no custom commands; all Tauri interaction is through plugins

---

## Development Commands

```bash
# Install dependencies
npm install

# Run frontend only (browser, hot-reload)
npm run dev

# Run as Tauri desktop app (opens native window)
npm run tauri dev

# Lint (ESLint)
npm run lint

# Build frontend only
npm run build

# Build native desktop installers (all platforms)
npm run tauri build
```

The dev server is fixed to port **5173** (`vite.config.js` uses `strictPort: true`) because Tauri hard-codes this URL.

---

## Architecture

### Dual Runtime

The app detects whether it is running inside Tauri at runtime via `window.__TAURI_INTERNALS__` (see `src/utils/fileManager.js:isDesktopApp()`). Every Tauri API import is done **dynamically** (via `import()`) so the web build does not fail when those modules are unavailable. Always preserve this pattern when adding new Tauri features.

### State Flow

All global state lives in `App.jsx` and is composed from custom hooks:

| Hook | Responsibility |
|------|---------------|
| `useTabs` | Multi-document tab state (open, close, switch, dirty tracking) |
| `useTheme` | Dark/light theme, persisted to `localStorage` |
| `useLinter` | Markdown linting with 400ms debounce, persisted strictness |
| `useRecentFiles` | Last 10 opened files, persisted to `localStorage` |
| `useToast` | Transient success/error/warning/info notifications |

State is passed down as props; there is no context or global store.

### Editor Modes

Three modes are rendered by `App.jsx`'s `renderEditor()` function:

- **`wysiwyg`** — `<MilkdownEditor>` only (Crepe/ProseMirror)
- **`source`** — `<SourceEditor>` only (plain `<textarea>` with line numbers)
- **`split`** — both side-by-side inside `.split-view`

`editorMode` is persisted to `localStorage` under `mdviewer-editor-mode`.

When loading external content into the WYSIWYG editor, the `key={editorContentKey}` prop is bumped to force a React remount — this is intentional because Milkdown does not support controlled updates without destroying and recreating the instance.

---

## Directory Structure

```
MDViewer/
├── src/
│   ├── App.jsx                  # Root component — orchestrates all state and layout
│   ├── main.jsx                 # React entry point
│   ├── index.css                # Design system: CSS variables, resets, layout primitives
│   ├── App.css                  # Top-level layout (app, app-body, split-view, editor-pane)
│   ├── components/
│   │   ├── MilkdownEditor.jsx   # WYSIWYG editor (Milkdown Crepe wrapper)
│   │   ├── SourceEditor.jsx     # Raw markdown textarea with line numbers
│   │   ├── EditorModeToggle.jsx # WYSIWYG / Source / Split segmented control
│   │   ├── TitleBar.jsx         # Custom frameless window titlebar (desktop only)
│   │   ├── TabBar.jsx           # Multi-document tab strip
│   │   ├── Sidebar.jsx          # File explorer with lazy-loaded directory tree
│   │   ├── FindReplace.jsx      # Find & Replace panel (operates on raw markdown)
│   │   ├── WelcomeScreen.jsx    # Shown when editor is empty; recent files list
│   │   ├── ConfirmDialog.jsx    # Save-before-close modal
│   │   ├── StatusBar.jsx        # Lint summary, word/char count, theme toggle, mode toggle
│   │   └── ToastContainer.jsx   # Positioned toast notification stack
│   ├── hooks/
│   │   ├── useTabs.js
│   │   ├── useTheme.js
│   │   ├── useLinter.js
│   │   ├── useRecentFiles.js
│   │   └── useToast.js
│   └── utils/
│       ├── fileManager.js       # openFile / saveFile / saveFileAs / getFileName / isDesktopApp
│       ├── linter.js            # Rule-based markdown linter (lintMarkdown, getAllRules, STRICTNESS_OPTIONS)
│       └── pdfExport.js         # Print-to-PDF via hidden iframe
├── src-tauri/
│   ├── src/
│   │   ├── lib.rs               # Tauri app setup — registers plugins
│   │   └── main.rs              # Desktop entry point, calls lib::run()
│   ├── Cargo.toml               # Rust dependencies
│   ├── tauri.conf.json          # App metadata, window config, CSP, bundle targets
│   └── capabilities/default.json  # Tauri permission grants
├── .github/workflows/release.yml  # CI: build & publish on `v*` tags
├── vite.config.js
├── eslint.config.js
└── package.json
```

---

## Key Conventions

### JavaScript / React

- **Functional components only.** No class components.
- **`useCallback` for all event handlers** passed as props or used in `useEffect` dependency arrays.
- **Named exports for hooks** (`export function useFoo`), **default exports for components**.
- **Co-located CSS** — each component has a matching `.css` file in the same directory.
- Unused variable lint rule: `no-unused-vars` with `varsIgnorePattern: '^[A-Z_]'` — uppercase-only names (e.g., constants) are exempted.
- Do not use TypeScript. Use JSDoc where documentation is warranted.
- Tauri APIs must always be imported dynamically: `await import('@tauri-apps/plugin-*')`. Never import them at the module top level.

### CSS

- All design tokens (colors, spacing, font sizes, border radii) are declared as CSS custom properties in `src/index.css` under `:root` and `[data-theme="dark"]`.
- Theme switching is applied via the `data-theme` attribute on `<div class="app">` (and mirrored to `document.documentElement` by `useTheme`).
- Never hardcode color values in component CSS files — always use `var(--token-name)`.

### localStorage Keys

All persisted settings share the `mdviewer-` prefix:

| Key | Value |
|-----|-------|
| `mdviewer-theme` | `"dark"` \| `"light"` |
| `mdviewer-editor-mode` | `"wysiwyg"` \| `"source"` \| `"split"` |
| `mdviewer-lint-strictness` | `"relaxed"` \| `"standard"` \| `"strict"` |
| `mdviewer-lint-enabled` | `"true"` \| `"false"` |
| `mdviewer-recent-files` | JSON array of `{ path, filename, openedAt }` |

### Tauri Rust Backend

The Rust side (`src-tauri/src/lib.rs`) is intentionally minimal — it only registers plugins. All business logic lives in the JavaScript frontend. When adding new native capabilities:
1. Add the plugin to `Cargo.toml`
2. Register it in `lib.rs`
3. Grant permissions in `capabilities/default.json`
4. Import it dynamically in `src/utils/` with a browser fallback

---

## Linter Engine (`src/utils/linter.js`)

The linter is a custom rule-based engine (not the `markdownlint` npm package, though it is listed as a dependency). Rules are defined in the `RULES` object and each has:

- `level`: `"relaxed"` | `"standard"` | `"strict"` — determines which strictness presets include the rule
- `severity`: `"error"` | `"warning"` | `"info"`
- `check(lines: string[])`: returns an array of `{ line, column, message }` objects

Strictness levels are cumulative: `strict` includes all `relaxed` + `standard` + `strict` rules.

Current rules: MD001, MD004, MD009, MD012, MD013, MD018, MD022, MD025, MD031, MD032, MD037, MD047.

When adding a new rule, follow the existing pattern: add it to `RULES`, assign a level and severity, and export updated `STRICTNESS_OPTIONS` counts automatically (they are derived).

---

## MilkdownEditor Lifecycle Notes

`MilkdownEditor.jsx` wraps the Milkdown Crepe editor. Important behaviors to be aware of:

- The editor is **uncontrolled** after initialization. External content changes (file opens, find-replace) trigger a full `destroy()` + `initEditor()` cycle.
- The `key={editorContentKey}` on `<MilkdownEditor>` in `App.jsx` is the primary mechanism for forcing remounts; bump `editorContentKey` whenever you need a fresh editor instance.
- `editorInstanceRef.current` exposes `{ getMarkdown(), setContent() }` so the parent can read the current markdown before save operations.
- The `// eslint-disable-line react-hooks/exhaustive-deps` suppressions in this file are intentional — the `useEffect` for initialization must only run once on mount.

---

## File I/O Pattern (`src/utils/fileManager.js`)

All file operations follow this pattern:
1. Call `ensureTauri()` — lazy-loads Tauri plugins; returns `false` in browsers.
2. If Tauri is available: use native dialogs (`tauriDialog`) and filesystem (`tauriFs`).
3. If not: use browser fallbacks (`<input type="file">` for open, `<a download>` for save).

Supported file extensions: `.md`, `.markdown`, `.mdown`, `.mkd`, `.mdx`, `.txt`.

---

## Release / CI

Releases are triggered by pushing a `v*` tag (e.g., `v1.0.0`). The GitHub Actions workflow (`.github/workflows/release.yml`) builds native installers for:

- **Ubuntu 22.04** — `.AppImage`, `.deb`
- **macOS** — universal binary `.dmg` (`x86_64` + `aarch64`)
- **Windows** — `.msi`

The workflow creates a **draft** release. Publish it manually after verifying the artifacts.

---

## Testing

There is currently no automated test suite. When adding tests, prefer:
- Unit tests for pure utility functions in `src/utils/`
- Integration tests for hooks using React Testing Library

---

## Common Pitfalls

1. **Don't import Tauri plugins at the top level.** Always use dynamic `import()` inside functions. The web build has no Tauri runtime and will error at module load time.
2. **Don't use `key` on `<MilkdownEditor>` carelessly.** Each key change destroys and rebuilds the ProseMirror instance, which is expensive. Only bump `editorContentKey` when content must be replaced wholesale.
3. **`useTabs` never closes the last tab** — it resets it to a blank untitled state. Don't add logic that assumes tabs can be fully empty.
4. **The `activeTabIdRef`** in `App.jsx` tracks the active tab ID in a ref so that event handlers (keyboard shortcuts, drag-drop) always see the current tab without stale closures.
5. **Sidebar is Tauri-only.** `openFolder` and `handleFileClick` do nothing in a browser. This is expected behavior.
