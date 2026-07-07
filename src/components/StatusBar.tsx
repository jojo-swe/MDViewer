import { useState, useRef, useEffect } from 'react';
import {
  Sun,
  Moon,
  ChevronUp,
  ChevronDown,
  AlertCircle,
  AlertTriangle,
  Info,
  CheckCircle,
  X,
  Shield,
  ShieldCheck,
  ShieldAlert,
  Settings,
} from 'lucide-react';
import { STRICTNESS_OPTIONS } from '../utils/linter';
import type { LintResult, StrictnessLevel } from '../types/lint';
import type { Theme, EditorMode } from '../types/settings';
import EditorModeToggle from './EditorModeToggle';
import './StatusBar.css';

interface StatusBarProps {
  theme: Theme;
  onToggleTheme: () => void;
  markdown: string;
  lintResults: LintResult;
  lintStrictness: StrictnessLevel;
  onSetStrictness: (level: StrictnessLevel) => void;
  lintEnabled: boolean;
  onToggleLint: () => void;
  editorMode: EditorMode;
  onSetEditorMode: (mode: EditorMode) => void;
  onOpenSettings: () => void;
}

export default function StatusBar({
  theme,
  onToggleTheme,
  markdown,
  lintResults,
  lintStrictness,
  onSetStrictness,
  lintEnabled,
  onToggleLint,
  editorMode,
  onSetEditorMode,
  onOpenSettings,
}: StatusBarProps) {
  const [expanded, setExpanded] = useState(false);
  const [showStrictnessMenu, setShowStrictnessMenu] = useState(false);
  const strictnessRef = useRef<HTMLDivElement>(null);

  // Word count
  const wordCount = markdown
    ? markdown
        .replace(/```[\s\S]*?```/g, '')
        .replace(/[#*_~`>\-|]/g, '')
        .split(/\s+/)
        .filter((w) => w.length > 0).length
    : 0;

  const charCount = markdown ? markdown.length : 0;

  // Close menu on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (strictnessRef.current && !strictnessRef.current.contains(e.target as Node)) {
        setShowStrictnessMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, []);

  const { summary } = lintResults;
  const totalIssues = summary.errors + summary.warnings + summary.infos;

  const StrictnessIcon = lintStrictness === 'strict' ? ShieldAlert : lintStrictness === 'standard' ? ShieldCheck : Shield;

  return (
    <>
      {/* Lint Issues Panel */}
      {expanded && lintEnabled && (
        <div className="lint-panel" id="lint-panel">
          <div className="lint-panel-header">
            <h3 className="lint-panel-title">
              <AlertCircle size={14} />
              Lint Issues
              {totalIssues > 0 && <span className="lint-panel-count">{totalIssues}</span>}
            </h3>
            <button className="lint-panel-close" onClick={() => setExpanded(false)} aria-label="Close lint panel">
              <X size={14} />
            </button>
          </div>
          <div className="lint-panel-body">
            {lintResults.issues.length === 0 ? (
              <div className="lint-panel-empty">
                <CheckCircle size={20} />
                <span>No issues found. Your markdown looks great!</span>
              </div>
            ) : (
              <ul className="lint-issue-list">
                {lintResults.issues.map((issue, i) => (
                  <li key={`${issue.ruleId}-${issue.line}-${i}`} className={`lint-issue lint-issue--${issue.severity}`}>
                    <span className="lint-issue-icon">
                      {issue.severity === 'error' && <AlertCircle size={13} />}
                      {issue.severity === 'warning' && <AlertTriangle size={13} />}
                      {issue.severity === 'info' && <Info size={13} />}
                    </span>
                    <span className="lint-issue-location">L{issue.line}</span>
                    <span className="lint-issue-message">{issue.message}</span>
                    <span className="lint-issue-rule">{issue.ruleId}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}

      {/* Status Bar */}
      <div className="status-bar" id="status-bar">
        <div className="status-bar-left">
          {/* Lint Toggle */}
          <button
            className={`status-btn status-lint-toggle ${lintEnabled ? 'active' : ''}`}
            onClick={onToggleLint}
            title={lintEnabled ? 'Disable linting' : 'Enable linting'}
            id="lint-toggle-btn"
          >
            <StrictnessIcon size={13} />
            <span>Lint</span>
          </button>

          {/* Strictness Picker */}
          {lintEnabled && (
            <div className="status-strictness-wrapper" ref={strictnessRef}>
              <button
                className="status-btn"
                onClick={() => setShowStrictnessMenu((v) => !v)}
                title="Change lint strictness"
                id="strictness-btn"
              >
                <span className={`strictness-dot strictness-dot--${lintStrictness}`} />
                <span>{lintStrictness.charAt(0).toUpperCase() + lintStrictness.slice(1)}</span>
              </button>

              {showStrictnessMenu && (
                <div className="strictness-menu" id="strictness-menu">
                  {STRICTNESS_OPTIONS.map((opt) => (
                    <button
                      key={opt.value}
                      className={`strictness-option ${lintStrictness === opt.value ? 'active' : ''}`}
                      onClick={() => {
                        onSetStrictness(opt.value);
                        setShowStrictnessMenu(false);
                      }}
                    >
                      <div className="strictness-option-header">
                        <span className={`strictness-dot strictness-dot--${opt.value}`} />
                        <span className="strictness-option-label">{opt.label}</span>
                        <span className="strictness-option-count">{opt.ruleCount} rules</span>
                      </div>
                      <span className="strictness-option-desc">{opt.description}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Issue Summary */}
          {lintEnabled && totalIssues > 0 && (
            <button
              className="status-btn status-issues"
              onClick={() => setExpanded((v) => !v)}
              title={expanded ? 'Hide issues' : 'Show issues'}
              id="issues-btn"
            >
              {summary.errors > 0 && (
                <span className="issue-badge issue-badge--error">
                  <AlertCircle size={11} />
                  {summary.errors}
                </span>
              )}
              {summary.warnings > 0 && (
                <span className="issue-badge issue-badge--warning">
                  <AlertTriangle size={11} />
                  {summary.warnings}
                </span>
              )}
              {summary.infos > 0 && (
                <span className="issue-badge issue-badge--info">
                  <Info size={11} />
                  {summary.infos}
                </span>
              )}
              {expanded ? <ChevronDown size={12} /> : <ChevronUp size={12} />}
            </button>
          )}
          {lintEnabled && totalIssues === 0 && (
            <span className="status-clean">
              <CheckCircle size={12} />
              Clean
            </span>
          )}
        </div>

        <div className="status-bar-right">
          <EditorModeToggle mode={editorMode} onModeChange={onSetEditorMode} />
          <span className="status-divider" />
          <span className="status-stat">{wordCount} words</span>
          <span className="status-divider" />
          <span className="status-stat">{charCount} chars</span>
          <span className="status-divider" />

          <button
            className="status-btn status-theme-toggle"
            onClick={onToggleTheme}
            title={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'}
            id="theme-toggle-btn"
          >
            {theme === 'dark' ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <button
            className="status-btn"
            onClick={onOpenSettings}
            title="Settings (Ctrl+,)"
            id="settings-btn"
          >
            <Settings size={14} />
          </button>
        </div>
      </div>
    </>
  );
}
