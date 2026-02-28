<div align="center">

# ✨ MDViewer

**Powerful. Lightweight. Beautiful.**

A modern, cross-platform Markdown editor built with React and Tauri.  
WYSIWYG editing, live split view, configurable linting, and native performance.

[![Release](https://img.shields.io/github/v/release/jojo-swe/MDViewer?style=flat-square&color=6366f1)](https://github.com/jojo-swe/MDViewer/releases)
[![License](https://img.shields.io/github/license/jojo-swe/MDViewer?style=flat-square)](LICENSE)
[![Platform](https://img.shields.io/badge/platform-Windows%20%7C%20macOS%20%7C%20Linux-6366f1?style=flat-square)](#installation)

<br />

![MDViewer Split View](docs/screenshots/split.png)

</div>

---

## Features

### 🖊️ Three Editor Modes

Switch seamlessly between the editing experience that suits you:

| Mode | Description |
|------|-------------|
| **WYSIWYG** | Rich, interactive editing — what you see is what you get |
| **Source** | Raw markdown with numbered lines and monospace styling |
| **Split** | Side-by-side source + live preview |

<details>
<summary>📸 See all modes</summary>
<br />

| WYSIWYG | Source | Split |
|---------|--------|-------|
| ![WYSIWYG](docs/screenshots/wysiwyg.png) | ![Source](docs/screenshots/source.png) | ![Split](docs/screenshots/split.png) |

</details>

### 📑 Multi-Document Tabs

Open multiple files in tabs with dirty-state indicators, drag-and-drop file opening, and fast tab cycling.

### 📂 File Explorer Sidebar

Browse and open files from any folder with a lazy-loaded tree view. Toggle with `Ctrl+B`.

### 🔍 Find & Replace

Full-featured find with regex support, case sensitivity toggle, match navigation, **Replace**, and **Replace All** — all working on the actual markdown source.

### 📝 Markdown Linting

Configurable strictness levels (**Relaxed**, **Standard**, **Strict**) with real-time issue detection. See error/warning/info counts in the status bar and expand the lint panel for details.

### 🎨 Dark & Light Themes

A polished dark theme (default) and a clean light theme, switchable from the status bar.

### 🛡️ Safe Editing

- **Save before close dialog** — Never lose unsaved work again
- **Toast notifications** — Clear feedback on save, open, export, and errors
- **Recent files** — Quick access to your last 10 documents from the welcome screen

### 📄 PDF Export

Export your document to PDF via the browser's native print dialog with theme-aware styling. `Ctrl+Shift+E`.

### 💻 Native Desktop App

Built on [Tauri](https://tauri.app/) for native performance with a tiny footprint. Custom frameless titlebar, native file dialogs, and platform-specific installers.

---

## Keyboard Shortcuts

| Action | Shortcut |
|--------|----------|
| New Document | `Ctrl+N` |
| Open File | `Ctrl+O` |
| Save | `Ctrl+S` |
| Save As | `Ctrl+Shift+S` |
| Close Tab | `Ctrl+W` |
| Cycle Tabs | `Ctrl+Tab` / `Ctrl+Shift+Tab` |
| Toggle Sidebar | `Ctrl+B` |
| Find | `Ctrl+F` |
| Find & Replace | `Ctrl+H` |
| Export PDF | `Ctrl+Shift+E` |
| WYSIWYG Mode | `Ctrl+Alt+1` |
| Source Mode | `Ctrl+Alt+2` |
| Split View | `Ctrl+Alt+3` |

---

## Installation

### Download

Grab the latest release for your platform from [**Releases**](https://github.com/jojo-swe/MDViewer/releases):

| Platform | Format |
|----------|--------|
| Windows | `.msi` installer |
| macOS | `.dmg` disk image |
| Linux | `.AppImage` / `.deb` |

### Build from Source

**Prerequisites:** [Node.js](https://nodejs.org/) ≥ 18, [Rust](https://rustup.rs/), [Tauri prerequisites](https://v2.tauri.app/start/prerequisites/)

```bash
# Clone the repo
git clone https://github.com/jojo-swe/MDViewer.git
cd MDViewer

# Install dependencies
npm install

# Run in development mode (browser)
npm run dev

# Run as desktop app (Tauri)
npm run tauri dev

# Build production installers
npm run tauri build
```

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite |
| **Editor** | [Milkdown Crepe](https://milkdown.dev/) (ProseMirror-based) |
| **Desktop** | [Tauri v2](https://tauri.app/) (Rust backend) |
| **Icons** | [Lucide React](https://lucide.dev/) |
| **Linting** | Custom markdown linter with configurable rules |
| **CI/CD** | GitHub Actions — auto-build on `v*` tags |

---

## Project Structure

```
MDViewer/
├── src/
│   ├── components/          # UI components
│   │   ├── TitleBar.jsx     # Custom frameless titlebar
│   │   ├── TabBar.jsx       # Multi-document tabs
│   │   ├── Sidebar.jsx      # File explorer
│   │   ├── MilkdownEditor.jsx  # WYSIWYG editor
│   │   ├── SourceEditor.jsx # Raw markdown editor
│   │   ├── EditorModeToggle.jsx  # WYSIWYG/Source/Split toggle
│   │   ├── FindReplace.jsx  # Find & Replace panel
│   │   ├── WelcomeScreen.jsx  # Start screen with recent files
│   │   ├── ConfirmDialog.jsx   # Save-before-close dialog
│   │   ├── ToastContainer.jsx  # Notification toasts
│   │   └── StatusBar.jsx    # Lint, word count, theme, mode
│   ├── hooks/               # React hooks
│   │   ├── useTheme.js      # Dark/light theme
│   │   ├── useLinter.js     # Markdown linting
│   │   ├── useTabs.js       # Multi-document state
│   │   ├── useRecentFiles.js  # Recent files tracking
│   │   └── useToast.js      # Toast notifications
│   ├── utils/               # Utilities
│   │   ├── fileManager.js   # Tauri/browser file I/O
│   │   ├── linter.js        # Lint rules engine
│   │   └── pdfExport.js     # Print-to-PDF export
│   ├── App.jsx              # Main app orchestrator
│   └── index.css            # Design system & CSS variables
├── src-tauri/               # Tauri (Rust) backend
└── .github/workflows/       # CI/CD release pipeline
```

---

## Contributing

Contributions are welcome! Please open an issue first to discuss what you'd like to change.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## License

This project is licensed under the MIT License — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

Built with ❤️ using React, Tauri, and Milkdown

</div>
