# CLAUDE.md — MDViewer

Guidance for AI assistants working on the MDViewer codebase.

## Project Overview

MDViewer is a cross-platform WYSIWYG Markdown editor built with **React 19 + TypeScript + Vite** on the frontend and **Tauri v2 (Rust)** on the backend. It runs as a native desktop app (via Tauri) and as a browser-only web app (with graceful fallbacks).

**Key characteristics:**
- TypeScript in `strict` mode (`noUnusedLocals`, `noUnusedParameters`); shared types live in `src/types/`
- Plain CSS with custom properties — no preprocessors, no CSS-in-JS
- No state-management library — state lives in custom hooks composed in `App.tsx`
- The Rust backend has no custom commands; all native access is through Tauri plugins

---

## Development Commands

```bash
npm install            # also installs the husky pre-commit hook via "prepare"
npm run dev            # frontend only (browser, hot reload) on port 5173
npm run tauri:dev      # desktop app
npm run lint           # ESLint (typescript-eslint + react-hooks)
npm run typecheck      # tsc --noEmit
npm test               # Vitest in watch mode
npm run test:run       # Vitest once
npm run test:coverage  # what CI runs
npm run build          # production frontend build
npm run tauri:build    # native installers for the host platform
```

The dev server port is fixed at **5173** (`strictPort: true`) because Tauri hard-codes it.

**Before committing**, run `lint`, `typecheck` and `test:run`. The pre-commit hook enforces `lint` only; CI (`.github/workflows/ci.yml`) runs all four plus `build` on every PR to `main`.

---

## Architecture

### Dual runtime

Tauri is detected at runtime via `window.__TAURI_INTERNALS__` (`isDesktopApp()` in `src/utils/fileManager.ts`). Every Tauri import is **dynamic** (`await import('@tauri-apps/…')`) so the web build never loads Tauri modules at startup. Preserve this when adding native features.

### State flow

`App.tsx` composes these hooks and passes state down as props (no React context):

| Hook | Responsibility |
|------|---------------|
| `useSettings` | Single source of truth for user settings (theme, editor mode, lint, auto-save, word wrap, sync scroll, font size, recent files, custom shortcuts). Persists to `localStorage` and, on desktop, the Tauri Store |
| `useTabs` | Multi-document tabs: open, close, switch, reorder, dirty tracking |
| `useLinter` | Debounced linting driven by `settings.lint` |
| `useAutoSave` | Saves the dirty active tab after `settings.autoSave.interval` |
| `useShortcuts` / `useCommands` | Keyboard shortcuts and the command registry (`src/commands/registry.ts`) used by the command palette |
| `useOutline` | Heading outline for the sidebar |
| `useSyncScroll` | Scroll sync between panes in split mode |
| `useContextMenu` | Tab and editor context menus |
| `useToast` | Transient notifications |

`useTheme` and `useRecentFiles` still exist as standalone hooks (with tests) but `App.tsx` reads theme and recent files from `useSettings`.

### Editor modes

`App.tsx` renders one of three modes (`settings.editorMode`):

- **`wysiwyg`** — `<MilkdownEditor>` (Milkdown Crepe / ProseMirror). Code blocks are highlighted with **shiki** (`src/utils/highlight.ts`); math via KaTeX and diagrams via Mermaid (`src/utils/mathRenderer.ts`, `mermaidRenderer.ts`).
- **`source`** — `<SourceEditor>`: a `<textarea>` with transparent text layered over a `<pre>` that **highlight.js** (core + markdown only) fills with token-classed HTML. Both layers share padding, font size, line height, wrap mode and scrollbar gutter; if you change one, change the other.
- **`split`** — both side by side.

Bumping `editorContentKey` (the `key` on `<MilkdownEditor>`) forces a full editor remount; Milkdown has no controlled-update API.

### Themes

`src/themes/index.ts` defines built-in themes (`dark`, `light`, `github-dark`, `solarized-dark`, `solarized-light`). `applyTheme()` writes each theme's colours as CSS custom properties on `<html>` and sets `data-theme` to `dark`/`light`. Component CSS must use `var(--token)` — never hardcode colours — so every theme works automatically.

---

## Directory Structure

```
src/
├── App.tsx / App.css        # Orchestrates hooks, layout, editor modes
├── main.tsx / index.css     # Entry point; base tokens and resets
├── commands/registry.ts     # Command definitions for palette + shortcuts
├── components/              # One .tsx + co-located .css per component
│   ├── MilkdownEditor.tsx   # WYSIWYG (Crepe) with shiki/KaTeX/Mermaid
│   ├── SourceEditor.tsx     # Textarea + highlight.js overlay
│   ├── TabBar.tsx           # Tabs, drag-to-reorder, context menu
│   ├── Sidebar.tsx / Outline.tsx
│   ├── FindReplace.tsx      # CSS Highlight API; replace edits raw markdown
│   ├── CommandPalette.tsx / SettingsPanel.tsx / ContextMenu.tsx
│   ├── StatusBar.tsx / EditorModeToggle.tsx / TitleBar.tsx
│   └── WelcomeScreen.tsx / ConfirmDialog.tsx / ToastContainer.tsx
├── hooks/                   # See table above
├── themes/index.ts
├── types/                   # Tab, AppSettings, Lint, Command, Toast types
├── utils/                   # fileManager, linter, highlight, pdfExport, image/math/mermaid
└── test/                    # Vitest + Testing Library, mirrors src/ layout
src-tauri/                   # Rust shell: lib.rs registers plugins; tauri.conf.json
.github/workflows/           # ci.yml (PR checks), release.yml (tagged releases)
```

---

## Key Conventions

- **Functional components only**; default export for components, named export for hooks and utils.
- Type props with an `interface XxxProps`; put types shared across files in `src/types/`.
- `useCallback` for handlers passed as props or used in effect dependencies. Don't silence `react-hooks/exhaustive-deps` without a comment explaining why.
- Unused variables must start with `_` or an uppercase letter to be exempt from `@typescript-eslint/no-unused-vars`.
- In `catch (err)`, `err` is `unknown` — narrow with `err instanceof Error` before reading `.message`.
- **Tests:** add or update a test in `src/test/` alongside any behaviour change. Tauri modules are mocked in `src/test/setup.ts`.

### Linter engine (`src/utils/linter.ts`)

Custom rule engine (no `markdownlint` dependency). Each rule in `RULES` has a `level` (`relaxed` | `standard` | `strict`, cumulative), a `severity` (`error` | `warning` | `info`) and `check(lines: string[])` returning `{ line, column, message }[]`. Rule counts in `STRICTNESS_OPTIONS` are derived automatically. Current rules: MD001, MD004, MD009, MD012, MD013, MD018, MD022, MD025, MD031, MD032, MD037, MD047.

### Adding a native capability

1. Add the plugin to `src-tauri/Cargo.toml`
2. Register it in `src-tauri/src/lib.rs`
3. Grant permissions in `src-tauri/capabilities/default.json`
4. Import it dynamically from `src/utils/` with a browser fallback, and mock it in `src/test/setup.ts`

---

## Release / CI

- **`ci.yml`** — on pushes and PRs to `main`: version check → lint → typecheck → test with coverage → build.
- **`release.yml`** — on `v*` tags: builds installers on Ubuntu (`.deb`, `.AppImage`, `.rpm`), Windows (`.msi`, NSIS `.exe`; `bundle.targets: "all"`) and macOS (universal `.dmg`), and publishes the GitHub release immediately. Tags with a pre-release part (`v0.2.0-2`) are marked as pre-releases; plain `vX.Y.Z` tags are normal releases.

### Versioning rules (enforced by `npm run check:version`)

- `version` must be identical in `package.json`, `src-tauri/tauri.conf.json` and `src-tauri/Cargo.toml` (refresh the lockfiles with `npm install --package-lock-only` and `cargo update -w`).
- **Pre-releases must be numeric**: `0.2.0-2`, never `0.2.0-beta.2`. The Windows MSI bundler rejects text pre-release identifiers, which fails the Windows job and leaves the release without `.msi`/`.exe` files (this is what happened to `v0.2.0-beta.1`).
- The release tag must be `v` + the version. To release: bump the version, merge to `main`, then `git tag vX.Y.Z[-N] && git push origin vX.Y.Z[-N]`.

## Planning Docs

- `ROADMAP.md` — milestone checklist; tick items as they ship.
- `CHANGELOG.md` — Keep-a-Changelog format; add every user-facing change under `[Unreleased]`.

---

## Common Pitfalls

1. **Top-level Tauri imports** break the web build — always `await import()` inside a function.
2. **Remounting `<MilkdownEditor>`** (via `editorContentKey`) is expensive; only do it when content must be replaced wholesale.
3. **`useTabs` never removes the last tab** — it resets it to a blank "Untitled" tab.
4. **Source overlay drift:** any style that affects text layout on `.source-textarea` must be mirrored on `.source-highlight`, or colours will misalign with the caret.
5. **Sidebar file browsing is Tauri-only**; in the browser it is a no-op by design.
