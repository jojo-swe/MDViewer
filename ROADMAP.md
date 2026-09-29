# MDViewer Roadmap

This document outlines the planned development milestones for MDViewer. Items within each milestone are roughly ordered by priority. Completed items are checked off.

---

## Milestone 0.1.x — Polish & Cleanup

Quick-win fixes and documentation alignment.

- [x] Three editor modes: WYSIWYG, Source, Split view
- [x] Multi-document tabs with dirty-state tracking
- [x] File Explorer sidebar (Tauri desktop)
- [x] Find & Replace with regex and case-sensitivity support
- [x] Markdown linting with Relaxed / Standard / Strict levels
- [x] Dark & Light themes
- [x] PDF export via native print dialog
- [x] Recent files on the Welcome screen
- [x] Drag-and-drop file opening
- [x] Toast notifications
- [x] Save-before-close confirmation dialog
- [x] Fix welcome content Split View status label
- [x] Remove unused `markdownlint` npm dependency
- [x] Implement MD047 trailing-newline lint rule
- [x] Show regex error feedback in Find & Replace
- [x] Align `package.json` version with `tauri.conf.json`
- [x] Add `CHANGELOG.md`
- [x] Add pre-commit lint hook (ESLint)

---

## Milestone 0.2.0 — Quality & Core UX

Stability improvements and frequently-requested UX additions.

- [x] **Syntax highlighting in Source editor** — Integrate CodeMirror 6 or highlight.js for language-aware colouring in raw markdown mode
- [x] **Tab drag-and-drop reordering** — The `reorderTabs` hook already exists; add the drag UI to `TabBar`
- [x] **Word wrap toggle** — Per-mode setting to enable/disable soft wrapping in Source editor
- [x] **Auto-save** — Configurable interval (e.g. every 30 s) with a subtle status indicator
- [ ] **File System Access API for web** — Replace the forced-download fallback with a proper browser save dialog using the File System Access API
- [x] **Test suite** — Vitest + React Testing Library covering `src/utils/` and `src/hooks/`
- [ ] **More lint rules** — MD014 (dollar signs in code), MD034 (bare URLs), MD041 (first heading is h1)
- [ ] **Invalid regex user guidance** — Link or tooltip in Find & Replace explaining regex syntax

---

## Milestone 0.3.0 — New Features

Meaningful feature additions that expand the editor's capabilities.

- [x] **Command palette** (`Ctrl+Shift+P`) — Fuzzy-search over open files, recent files, and editor actions
- [x] **Table of contents panel** — Auto-generated from document headings, collapsible
- [ ] **Image paste & drag-drop** — Embed images via the Tauri asset protocol; show a base64 preview in web mode *(paste into the WYSIWYG editor shipped in 0.2.0-beta.1; drag-drop still open)*
- [ ] **HTML export** — Export the rendered document as a standalone `.html` file alongside the existing PDF option
- [ ] **Spell check** — Leverage the browser's native `spellcheck` attribute in Source mode; optional LanguageTool API integration for advanced checking
- [ ] **Folding in Source editor** — Collapse heading sections and code blocks
- [ ] **Minimap / scroll preview** — Small code overview beside the Source editor scrollbar

---

## Milestone 1.0.0 — Production Ready

Hardening, accessibility, and ecosystem improvements.

- [x] **Automated CI tests** — `ci.yml` runs lint, typecheck, tests and build on every PR to `main`
- [ ] **Accessibility audit** — Full keyboard navigation, ARIA labels, and screen reader pass for all UI surfaces
- [ ] **Mobile / responsive layout** — Gracefully handle narrow viewports in browser mode
- [x] **TypeScript migration** — Improve refactorability and IDE experience
- [x] **Auto-publish releases** — `release.yml` publishes on `v*` tags (`releaseDraft: false`)
- [ ] **Plugin / extension API** — Allow third-party scripts to add lint rules, export formats, or toolbar buttons

---

## Contributing

See [CONTRIBUTING](README.md#contributing) in the README. Open an issue before starting work on a milestone-0.3+ feature to align on approach.
