import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import SettingsPanel from '../../components/SettingsPanel';
import type { AppSettings } from '../../types/settings';

const DEFAULT_SETTINGS: AppSettings = {
  theme: 'dark',
  editorMode: 'wysiwyg',
  lint: { enabled: true, strictness: 'standard' },
  autoSave: { enabled: false, interval: 5000 },
  wordWrap: false,
  syncScroll: true,
  fontSize: 14,
  recentFiles: [],
  customShortcuts: {},
};

describe('SettingsPanel', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <SettingsPanel visible={false} settings={DEFAULT_SETTINGS} onClose={vi.fn()} onUpdate={vi.fn()} onReset={vi.fn()} />
    );
    expect(container.querySelector('.settings-overlay')).toBeNull();
  });

  it('renders sidebar with sections when visible', () => {
    render(<SettingsPanel visible={true} settings={DEFAULT_SETTINGS} onClose={vi.fn()} onUpdate={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getAllByText('General').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Editor').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Linting').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Shortcuts').length).toBeGreaterThan(0);
    expect(screen.getAllByText('About').length).toBeGreaterThan(0);
  });

  it('shows theme options in general section', () => {
    render(<SettingsPanel visible={true} settings={DEFAULT_SETTINGS} onClose={vi.fn()} onUpdate={vi.fn()} onReset={vi.fn()} />);
    expect(screen.getByText('Light')).toBeDefined();
    expect(screen.getByText('Dark')).toBeDefined();
  });

  it('calls onUpdate when clicking a theme option', () => {
    const onUpdate = vi.fn();
    render(<SettingsPanel visible={true} settings={DEFAULT_SETTINGS} onClose={vi.fn()} onUpdate={onUpdate} onReset={vi.fn()} />);
    fireEvent.click(screen.getByText('Light'));
    expect(onUpdate).toHaveBeenCalledWith({ theme: 'light' });
  });

  it('calls onClose when clicking close button', () => {
    const onClose = vi.fn();
    render(<SettingsPanel visible={true} settings={DEFAULT_SETTINGS} onClose={onClose} onUpdate={vi.fn()} onReset={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Close settings'));
    expect(onClose).toHaveBeenCalled();
  });

  it('calls onReset when clicking reset button', () => {
    const onReset = vi.fn();
    render(<SettingsPanel visible={true} settings={DEFAULT_SETTINGS} onClose={vi.fn()} onUpdate={vi.fn()} onReset={onReset} />);
    fireEvent.click(screen.getByText('Reset to Defaults'));
    expect(onReset).toHaveBeenCalled();
  });

  it('switches to shortcuts section and shows shortcuts', () => {
    render(<SettingsPanel visible={true} settings={DEFAULT_SETTINGS} onClose={vi.fn()} onUpdate={vi.fn()} onReset={vi.fn()} />);
    fireEvent.click(screen.getAllByText('Shortcuts')[0]);
    expect(screen.getByText('New Tab')).toBeDefined();
    expect(screen.getByText('Ctrl+N')).toBeDefined();
  });

  it('switches to about section and shows version', () => {
    render(<SettingsPanel visible={true} settings={DEFAULT_SETTINGS} onClose={vi.fn()} onUpdate={vi.fn()} onReset={vi.fn()} />);
    fireEvent.click(screen.getAllByText('About')[0]);
    expect(screen.getByText('Version 0.1.0')).toBeDefined();
  });

  it('shows linting section with strictness options', () => {
    render(<SettingsPanel visible={true} settings={DEFAULT_SETTINGS} onClose={vi.fn()} onUpdate={vi.fn()} onReset={vi.fn()} />);
    fireEvent.click(screen.getAllByText('Linting')[0]);
    expect(screen.getByText('Enable Linting')).toBeDefined();
    expect(screen.getByText('Strictness Level')).toBeDefined();
  });

  it('shows editor section with mode options', () => {
    render(<SettingsPanel visible={true} settings={DEFAULT_SETTINGS} onClose={vi.fn()} onUpdate={vi.fn()} onReset={vi.fn()} />);
    fireEvent.click(screen.getAllByText('Editor')[0]);
    expect(screen.getByText('Default Editor Mode')).toBeDefined();
    expect(screen.getByText('Sync Scrolling')).toBeDefined();
  });
});
