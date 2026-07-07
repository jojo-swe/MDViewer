import { useEffect, useRef, useState } from 'react';
import {
  X,
  Sun,
  Moon,
  Eye,
  Code,
  Columns2,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Save,
  RotateCcw,
  Keyboard,
  Info,
  Type,
  WrapText,
  ScrollText,
} from 'lucide-react';
import type { AppSettings } from '../types/settings';
import type { Theme, EditorMode } from '../types/settings';
import type { StrictnessLevel } from '../types/lint';
import { STRICTNESS_OPTIONS } from '../utils/linter';
import './SettingsPanel.css';

interface SettingsPanelProps {
  visible: boolean;
  settings: AppSettings;
  onClose: () => void;
  onUpdate: (update: Partial<AppSettings>) => void;
  onReset: () => void;
}

type SectionId = 'general' | 'editor' | 'linting' | 'shortcuts' | 'about';

const SECTIONS: Array<{ id: SectionId; label: string }> = [
  { id: 'general', label: 'General' },
  { id: 'editor', label: 'Editor' },
  { id: 'linting', label: 'Linting' },
  { id: 'shortcuts', label: 'Shortcuts' },
  { id: 'about', label: 'About' },
];

const SHORTCUTS: Array<{ action: string; keys: string }> = [
  { action: 'New Tab', keys: 'Ctrl+N' },
  { action: 'Open File', keys: 'Ctrl+O' },
  { action: 'Save', keys: 'Ctrl+S' },
  { action: 'Save As', keys: 'Ctrl+Shift+S' },
  { action: 'Export PDF', keys: 'Ctrl+Shift+E' },
  { action: 'Close Tab', keys: 'Ctrl+W' },
  { action: 'Toggle Sidebar', keys: 'Ctrl+B' },
  { action: 'Find', keys: 'Ctrl+F' },
  { action: 'Find & Replace', keys: 'Ctrl+H' },
  { action: 'Cycle Tabs', keys: 'Ctrl+Tab' },
  { action: 'WYSIWYG Mode', keys: 'Ctrl+Alt+1' },
  { action: 'Source Mode', keys: 'Ctrl+Alt+2' },
  { action: 'Split Mode', keys: 'Ctrl+Alt+3' },
  { action: 'Command Palette', keys: 'Ctrl+Shift+P' },
  { action: 'Settings', keys: 'Ctrl+,' },
];

export default function SettingsPanel({ visible, settings, onClose, onUpdate, onReset }: SettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<SectionId>('general');
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!visible) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onClose]);

  if (!visible) return null;

  const themeOptions: Array<{ value: Theme; label: string; icon: React.ReactNode }> = [
    { value: 'light', label: 'Light', icon: <Sun size={15} /> },
    { value: 'dark', label: 'Dark', icon: <Moon size={15} /> },
  ];

  const modeOptions: Array<{ value: EditorMode; label: string; icon: React.ReactNode }> = [
    { value: 'wysiwyg', label: 'WYSIWYG', icon: <Eye size={15} /> },
    { value: 'source', label: 'Source', icon: <Code size={15} /> },
    { value: 'split', label: 'Split', icon: <Columns2 size={15} /> },
  ];

  const strictnessIcons: Record<StrictnessLevel, React.ReactNode> = {
    relaxed: <Shield size={15} />,
    standard: <ShieldCheck size={15} />,
    strict: <ShieldAlert size={15} />,
  };

  return (
    <div className="settings-overlay" onClick={onClose}>
      <div
        className="settings-panel"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-label="Settings"
        onClick={(e) => e.stopPropagation()}
        id="settings-panel"
      >
        {/* Sidebar */}
        <div className="settings-sidebar">
          <div className="settings-sidebar-header">
            <h2 className="settings-sidebar-title">Settings</h2>
          </div>
          <nav className="settings-nav">
            {SECTIONS.map((s) => (
              <button
                key={s.id}
                className={`settings-nav-item ${activeSection === s.id ? 'active' : ''}`}
                onClick={() => setActiveSection(s.id)}
              >
                {s.label}
              </button>
            ))}
          </nav>
          <button className="settings-reset-btn" onClick={onReset} title="Reset all settings to defaults">
            <RotateCcw size={13} />
            Reset to Defaults
          </button>
        </div>

        {/* Content */}
        <div className="settings-content">
          <div className="settings-content-header">
            <h3 className="settings-content-title">
              {SECTIONS.find((s) => s.id === activeSection)?.label}
            </h3>
            <button className="settings-close" onClick={onClose} aria-label="Close settings">
              <X size={18} />
            </button>
          </div>

          <div className="settings-content-body">
            {/* General */}
            {activeSection === 'general' && (
              <div className="settings-section">
                <div className="setting-row">
                  <div className="setting-label">
                    <Sun size={16} className="setting-icon" />
                    <div>
                      <div className="setting-name">Theme</div>
                      <div className="setting-desc">Choose light or dark appearance</div>
                    </div>
                  </div>
                  <div className="setting-control">
                    <div className="setting-segmented">
                      {themeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          className={`segmented-btn ${settings.theme === opt.value ? 'active' : ''}`}
                          onClick={() => onUpdate({ theme: opt.value })}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-label">
                    <Type size={16} className="setting-icon" />
                    <div>
                      <div className="setting-name">Font Size</div>
                      <div className="setting-desc">Editor font size in pixels</div>
                    </div>
                  </div>
                  <div className="setting-control">
                    <input
                      type="range"
                      min={10}
                      max={24}
                      step={1}
                      value={settings.fontSize}
                      onChange={(e) => onUpdate({ fontSize: Number(e.target.value) })}
                      className="setting-slider"
                    />
                    <span className="setting-slider-value">{settings.fontSize}px</span>
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-label">
                    <WrapText size={16} className="setting-icon" />
                    <div>
                      <div className="setting-name">Word Wrap</div>
                      <div className="setting-desc">Wrap long lines in the editor</div>
                    </div>
                  </div>
                  <div className="setting-control">
                    <label className="setting-toggle">
                      <input
                        type="checkbox"
                        checked={settings.wordWrap}
                        onChange={(e) => onUpdate({ wordWrap: e.target.checked })}
                      />
                      <span className="setting-toggle-track" />
                    </label>
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-label">
                    <Save size={16} className="setting-icon" />
                    <div>
                      <div className="setting-name">Auto-save</div>
                      <div className="setting-desc">Automatically save files at a set interval</div>
                    </div>
                  </div>
                  <div className="setting-control">
                    <label className="setting-toggle">
                      <input
                        type="checkbox"
                        checked={settings.autoSave.enabled}
                        onChange={(e) => onUpdate({ autoSave: { ...settings.autoSave, enabled: e.target.checked } })}
                      />
                      <span className="setting-toggle-track" />
                    </label>
                  </div>
                </div>

                {settings.autoSave.enabled && (
                  <div className="setting-row">
                    <div className="setting-label">
                      <div>
                        <div className="setting-name">Auto-save Interval</div>
                        <div className="setting-desc">Time between saves in seconds</div>
                      </div>
                    </div>
                    <div className="setting-control">
                      <input
                        type="number"
                        min={1}
                        max={60}
                        value={Math.round(settings.autoSave.interval / 1000)}
                        onChange={(e) => onUpdate({ autoSave: { ...settings.autoSave, interval: Math.max(1, Number(e.target.value)) * 1000 } })}
                        className="setting-input"
                      />
                      <span className="setting-unit">sec</span>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Editor */}
            {activeSection === 'editor' && (
              <div className="settings-section">
                <div className="setting-row">
                  <div className="setting-label">
                    <Eye size={16} className="setting-icon" />
                    <div>
                      <div className="setting-name">Default Editor Mode</div>
                      <div className="setting-desc">Mode to open new tabs in</div>
                    </div>
                  </div>
                  <div className="setting-control">
                    <div className="setting-segmented">
                      {modeOptions.map((opt) => (
                        <button
                          key={opt.value}
                          className={`segmented-btn ${settings.editorMode === opt.value ? 'active' : ''}`}
                          onClick={() => onUpdate({ editorMode: opt.value })}
                        >
                          {opt.icon}
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="setting-row">
                  <div className="setting-label">
                    <ScrollText size={16} className="setting-icon" />
                    <div>
                      <div className="setting-name">Sync Scrolling</div>
                      <div className="setting-desc">Synchronize scroll between editor and preview in split mode</div>
                    </div>
                  </div>
                  <div className="setting-control">
                    <label className="setting-toggle">
                      <input
                        type="checkbox"
                        checked={settings.syncScroll}
                        onChange={(e) => onUpdate({ syncScroll: e.target.checked })}
                      />
                      <span className="setting-toggle-track" />
                    </label>
                  </div>
                </div>
              </div>
            )}

            {/* Linting */}
            {activeSection === 'linting' && (
              <div className="settings-section">
                <div className="setting-row">
                  <div className="setting-label">
                    <Shield size={16} className="setting-icon" />
                    <div>
                      <div className="setting-name">Enable Linting</div>
                      <div className="setting-desc">Check markdown for style and syntax issues</div>
                    </div>
                  </div>
                  <div className="setting-control">
                    <label className="setting-toggle">
                      <input
                        type="checkbox"
                        checked={settings.lint.enabled}
                        onChange={(e) => onUpdate({ lint: { ...settings.lint, enabled: e.target.checked } })}
                      />
                      <span className="setting-toggle-track" />
                    </label>
                  </div>
                </div>

                {settings.lint.enabled && (
                  <div className="setting-row">
                    <div className="setting-label">
                      <ShieldCheck size={16} className="setting-icon" />
                      <div>
                        <div className="setting-name">Strictness Level</div>
                        <div className="setting-desc">How strict the linter should be</div>
                      </div>
                    </div>
                    <div className="setting-control">
                      <div className="setting-strictness-options">
                        {STRICTNESS_OPTIONS.map((opt) => (
                          <button
                            key={opt.value}
                            className={`strictness-card ${settings.lint.strictness === opt.value ? 'active' : ''}`}
                            onClick={() => onUpdate({ lint: { ...settings.lint, strictness: opt.value } })}
                          >
                            <div className="strictness-card-header">
                              {strictnessIcons[opt.value]}
                              <span className="strictness-card-label">{opt.label}</span>
                              <span className="strictness-card-count">{opt.ruleCount} rules</span>
                            </div>
                            <span className="strictness-card-desc">{opt.description}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Shortcuts */}
            {activeSection === 'shortcuts' && (
              <div className="settings-section">
                <div className="settings-section-info">
                  <Keyboard size={14} />
                  <span>Keyboard shortcuts are read-only in this version. Custom shortcuts coming in a future update.</span>
                </div>
                <div className="settings-shortcuts-list">
                  {SHORTCUTS.map((s) => (
                    <div key={s.action} className="shortcut-row">
                      <span className="shortcut-action">{s.action}</span>
                      <kbd className="shortcut-keys">{s.keys}</kbd>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            {activeSection === 'about' && (
              <div className="settings-section">
                <div className="settings-about">
                  <div className="settings-about-logo">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M4 4h16v16H4z" />
                      <path d="M8 8l4 4 4-4" />
                      <path d="M8 16h8" />
                    </svg>
                  </div>
                  <h3 className="settings-about-title">MDViewer</h3>
                  <p className="settings-about-version">Version 0.1.0</p>
                  <p className="settings-about-desc">
                    A powerful, lightweight, and beautiful WYSIWYG Markdown editor.
                  </p>
                  <div className="settings-about-links">
                    <a href="#" className="settings-about-link">
                      <Info size={13} />
                      Documentation
                    </a>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
