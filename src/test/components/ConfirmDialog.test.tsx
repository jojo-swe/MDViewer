import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ConfirmDialog from '../../components/ConfirmDialog';

describe('ConfirmDialog', () => {
  it('renders nothing when not visible', () => {
    const { container } = render(
      <ConfirmDialog visible={false} title="Test" message="Msg" onConfirm={vi.fn()} onDanger={vi.fn()} onCancel={vi.fn()} />
    );
    expect(container.querySelector('.confirm-overlay')).toBeNull();
  });

  it('renders title and message when visible', () => {
    render(
      <ConfirmDialog visible={true} title="Save changes?" message="You have unsaved work" onConfirm={vi.fn()} onDanger={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Save changes?')).toBeDefined();
    expect(screen.getByText('You have unsaved work')).toBeDefined();
  });

  it('calls onConfirm when clicking save button', () => {
    const onConfirm = vi.fn();
    render(
      <ConfirmDialog visible={true} title="Test" message="Msg" onConfirm={onConfirm} onDanger={vi.fn()} onCancel={vi.fn()} />
    );
    fireEvent.click(screen.getByText('Save'));
    expect(onConfirm).toHaveBeenCalled();
  });

  it('calls onDanger when clicking discard button', () => {
    const onDanger = vi.fn();
    render(
      <ConfirmDialog visible={true} title="Test" message="Msg" onConfirm={vi.fn()} onDanger={onDanger} onCancel={vi.fn()} />
    );
    fireEvent.click(screen.getByText("Don't Save"));
    expect(onDanger).toHaveBeenCalled();
  });

  it('calls onCancel when clicking cancel button', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog visible={true} title="Test" message="Msg" onConfirm={vi.fn()} onDanger={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.click(screen.getByText('Cancel'));
    expect(onCancel).toHaveBeenCalled();
  });

  it('calls onCancel when pressing Escape', () => {
    const onCancel = vi.fn();
    render(
      <ConfirmDialog visible={true} title="Test" message="Msg" onConfirm={vi.fn()} onDanger={vi.fn()} onCancel={onCancel} />
    );
    fireEvent.keyDown(window, { key: 'Escape' });
    expect(onCancel).toHaveBeenCalled();
  });

  it('renders custom button labels', () => {
    render(
      <ConfirmDialog visible={true} title="Test" message="Msg" confirmLabel="Yes" dangerLabel="No" cancelLabel="Back" onConfirm={vi.fn()} onDanger={vi.fn()} onCancel={vi.fn()} />
    );
    expect(screen.getByText('Yes')).toBeDefined();
    expect(screen.getByText('No')).toBeDefined();
    expect(screen.getByText('Back')).toBeDefined();
  });
});
