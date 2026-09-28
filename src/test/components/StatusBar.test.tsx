import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import StatusBar from '../../components/StatusBar';
import type { LintResult } from '../../types/lint';

const EMPTY_LINT: LintResult = { issues: [], summary: { errors: 0, warnings: 0, infos: 0 } };

describe('StatusBar', () => {
  it('renders word and char count', () => {
    render(
      <StatusBar
        theme="dark"
        onToggleTheme={vi.fn()}
        markdown="hello world"
        lintResults={EMPTY_LINT}
        lintStrictness="standard"
        onSetStrictness={vi.fn()}
        lintEnabled={true}
        onToggleLint={vi.fn()}
        editorMode="wysiwyg"
        onSetEditorMode={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );
    expect(screen.getByText('2 words')).toBeDefined();
    expect(screen.getByText('11 chars')).toBeDefined();
  });

  it('renders 0 for empty markdown', () => {
    render(
      <StatusBar
        theme="dark"
        onToggleTheme={vi.fn()}
        markdown=""
        lintResults={EMPTY_LINT}
        lintStrictness="standard"
        onSetStrictness={vi.fn()}
        lintEnabled={true}
        onToggleLint={vi.fn()}
        editorMode="wysiwyg"
        onSetEditorMode={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );
    expect(screen.getByText('0 words')).toBeDefined();
  });

  it('calls onToggleTheme when clicking theme button', () => {
    const onToggleTheme = vi.fn();
    render(
      <StatusBar
        theme="dark"
        onToggleTheme={onToggleTheme}
        markdown=""
        lintResults={EMPTY_LINT}
        lintStrictness="standard"
        onSetStrictness={vi.fn()}
        lintEnabled={true}
        onToggleLint={vi.fn()}
        editorMode="wysiwyg"
        onSetEditorMode={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );
    fireEvent.click(screen.getByTitle('Switch to light mode'));
    expect(onToggleTheme).toHaveBeenCalled();
  });

  it('calls onOpenSettings when clicking settings button', () => {
    const onOpenSettings = vi.fn();
    render(
      <StatusBar
        theme="dark"
        onToggleTheme={vi.fn()}
        markdown=""
        lintResults={EMPTY_LINT}
        lintStrictness="standard"
        onSetStrictness={vi.fn()}
        lintEnabled={true}
        onToggleLint={vi.fn()}
        editorMode="wysiwyg"
        onSetEditorMode={vi.fn()}
        onOpenSettings={onOpenSettings}
      />
    );
    fireEvent.click(screen.getByTitle('Settings (Ctrl+,)'));
    expect(onOpenSettings).toHaveBeenCalled();
  });

  it('shows clean status when lint enabled and no issues', () => {
    render(
      <StatusBar
        theme="dark"
        onToggleTheme={vi.fn()}
        markdown=""
        lintResults={EMPTY_LINT}
        lintStrictness="standard"
        onSetStrictness={vi.fn()}
        lintEnabled={true}
        onToggleLint={vi.fn()}
        editorMode="wysiwyg"
        onSetEditorMode={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );
    expect(screen.getByText('Clean')).toBeDefined();
  });

  it('shows issue counts when there are issues', () => {
    const lintResults: LintResult = {
      issues: [
        { line: 1, column: 1, message: 'err', ruleId: 'X', severity: 'error' },
        { line: 2, column: 1, message: 'warn', ruleId: 'Y', severity: 'warning' },
      ],
      summary: { errors: 1, warnings: 1, infos: 0 },
    };
    render(
      <StatusBar
        theme="dark"
        onToggleTheme={vi.fn()}
        markdown=""
        lintResults={lintResults}
        lintStrictness="standard"
        onSetStrictness={vi.fn()}
        lintEnabled={true}
        onToggleLint={vi.fn()}
        editorMode="wysiwyg"
        onSetEditorMode={vi.fn()}
        onOpenSettings={vi.fn()}
      />
    );
    expect(screen.getAllByText('1').length).toBeGreaterThan(0);
  });
});
