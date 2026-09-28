# Changelog

All notable changes to MDViewer are documented here.

Format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).
Versioning follows [Semantic Versioning](https://semver.org/).

---

## [Unreleased]

### Added
- Syntax highlighting in the Source editor: highlight.js (core + markdown only) renders a colour-coded layer behind the transparent textarea, using theme CSS variables so every built-in theme works; follows the font size and word-wrap settings
- Tab drag-and-drop reordering using the native HTML5 drag API; the dragged tab fades and a left accent bar marks the drop target
- Pre-commit hook (husky) that runs `npm run lint`
- `npm run check:version` (run in CI and before release builds): versions must match across `package.json`, `tauri.conf.json` and `Cargo.toml`, pre-releases must be numeric so the Windows MSI builds, and the tag must match the version

### Changed
- Pre-release versions are now numeric (`0.2.0-2` instead of `0.2.0-beta.2`) so the Windows build succeeds and releases include the `.msi` and `.exe`
- Release workflow marks a release as a pre-release based on its tag (`v0.2.0-2` → pre-release, `v0.2.0` → normal release)

### Fixed
- MD047 (single trailing newline) was a no-op stub; it now flags files that don't end with a newline
- Find & Replace now shows the error message for an invalid regex instead of silently returning no results
- Welcome document listed Split View as "Coming"; it has shipped

### Removed
- Unused `markdownlint` dependency (the linter is a custom engine)

---

## [0.2.0-beta.1]

### Added
- TypeScript (strict mode) across the codebase
- Vitest + Testing Library test suite and a CI workflow (lint, typecheck, test, build)
- Shiki code-block highlighting, Mermaid diagrams and KaTeX math in the WYSIWYG editor
- Image paste and insert
- Outline / table-of-contents sidebar
- Auto-save with a configurable interval
- Synchronised scrolling in split view
- Theme system with five built-in themes
- Configurable keyboard shortcuts with conflict detection, and a settings panel
- Command palette (`Ctrl+Shift+P`)
- Tab context menu (Close, Close Others, Close All, Copy Path)
- Status bar additions: stats popover, file path, selection count, reading time
- Prompt for unsaved changes across all dirty tabs when closing the window

### Changed
- Releases publish automatically and are marked as pre-releases for the beta series
- Google Fonts removed; the app no longer loads remote fonts
- App identifier changed to `com.mdviewer.desktop`

### Fixed
- Tauri window API is lazy-loaded so the web build no longer errors
- Clicking title bar controls no longer starts a window drag

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

[Unreleased]: https://github.com/jojo-swe/MDViewer/compare/v0.2.0-beta.1...HEAD
[0.2.0-beta.1]: https://github.com/jojo-swe/MDViewer/compare/v0.1.1...v0.2.0-beta.1
[0.1.0]: https://github.com/jojo-swe/MDViewer/releases/tag/v0.1.0
