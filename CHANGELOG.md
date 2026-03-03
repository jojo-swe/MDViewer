# Changelog

All notable changes to MDViewer are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- Pre-commit hook via husky v9 — `npm run lint` must pass before any commit is accepted
- Syntax highlighting in Source editor — highlight.js (core + markdown language only, ~45 KB) renders a colour-coded overlay behind the transparent textarea; headings, bold/italic, inline code, fenced code blocks, links, and list bullets are all coloured using the app's existing CSS design tokens so both light and dark themes work automatically

### Fixed
- Welcome content table incorrectly labelled Split View as "Coming" — it is fully shipped
- `package.json` version was `0.0.0`; aligned to `0.1.0` to match `tauri.conf.json`
- MD047 lint rule was a no-op stub; now correctly flags files missing a trailing newline
- Find & Replace silently swallowed invalid regex patterns; the error message is now shown below the search input
- `MilkdownEditor`: removed unused `theme` prop from component signature and all call sites
- `MilkdownEditor`: resolved `setContent`/`initEditor` circular forward-reference via a `useRef` indirection
- `TitleBar`: empty `catch {}` blocks now contain a comment to satisfy the `no-empty` rule
- `useTabs`: removed unused `useRef` import
- `useRecentFiles`: replaced `useEffect` + `setRecentFiles` with a lazy `useState` initializer, eliminating one extra render on mount
- `fileManager`: removed unused `isTauri` module-level variable

### Removed
- Unused `markdownlint` npm dependency (the app uses its own custom linter engine)

---

## [0.1.0] — 2025

Initial public release.

### Added
- **WYSIWYG editor** powered by [Milkdown Crepe](https://milkdown.dev/) (ProseMirror-based), supporting bold, italic, strikethrough, inline code, headings, lists, tables, blockquotes, code blocks, and LaTeX
- **Source editor** — raw markdown textarea with line numbers, scroll-sync, and Tab-key indentation
- **Split view** — source and WYSIWYG preview side-by-side
- **Editor mode toggle** in the status bar and keyboard shortcuts (`Ctrl+Alt+1/2/3`)
- **Multi-document tabs** with dirty-state indicators (orange dot), save-before-close dialog, and Ctrl+Tab cycling
- **File Explorer sidebar** (Tauri desktop only) with lazy-loaded directory tree; toggle with `Ctrl+B`
- **Find & Replace** panel with CSS Highlight API match highlighting, case-sensitivity toggle, regex mode, single replace, and Replace All
- **Markdown linting engine** — custom rule-based linter with three strictness presets:
  - *Relaxed*: MD001, MD018, MD037
  - *Standard*: adds MD004, MD012, MD022, MD025, MD031
  - *Strict*: adds MD009, MD013, MD032, MD047
- **Status bar** — lint issue count and panel, word/character count, theme toggle, editor mode toggle, and lint strictness picker
- **Dark & Light themes** — defaults to system preference; persisted to `localStorage`
- **PDF export** via native print dialog with theme-aware styling (`Ctrl+Shift+E`)
- **Recent files** — last 10 opened files shown on the Welcome screen; persisted to `localStorage`
- **Drag-and-drop** file opening for `.md`, `.markdown`, `.mdown`, `.mkd`, `.mdx`, `.txt`
- **Toast notifications** — contextual success, error, warning, and info messages with auto-dismiss
- **Custom frameless titlebar** on desktop (Tauri) with minimize, maximize, and close controls
- **Keyboard shortcuts**: `Ctrl+N`, `Ctrl+O`, `Ctrl+S`, `Ctrl+Shift+S`, `Ctrl+W`, `Ctrl+F`, `Ctrl+H`, `Ctrl+B`, `Ctrl+Shift+E`
- **Graceful browser fallbacks** for all file operations (open via `<input>`, save via download)
- **GitHub Actions CI** — automated cross-platform builds (Windows, macOS universal, Linux) on `v*` tag pushes

[Unreleased]: https://github.com/jojo-swe/MDViewer/compare/v0.1.0...HEAD
[0.1.0]: https://github.com/jojo-swe/MDViewer/releases/tag/v0.1.0
