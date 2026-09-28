import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ToastContainer from '../../components/ToastContainer';
import type { Toast } from '../../types/toast';

function makeToast(overrides: Partial<Toast> = {}): Toast {
  return {
    id: Math.floor(Math.random() * 10000),
    type: 'success',
    message: 'Test toast',
    ...overrides,
  };
}

describe('ToastContainer', () => {
  it('renders nothing when no toasts', () => {
    const { container } = render(<ToastContainer toasts={[]} onDismiss={vi.fn()} />);
    expect(container.querySelector('.toast-container')?.children.length ?? 0).toBe(0);
  });

  it('renders toasts with message', () => {
    const toasts = [makeToast({ id: 1, message: 'Hello world' })];
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByText('Hello world')).toBeDefined();
  });

  it('renders different toast types', () => {
    const toasts = [
      makeToast({ id: 1, type: 'success', message: 'Success' }),
      makeToast({ id: 2, type: 'error', message: 'Error' }),
      makeToast({ id: 3, type: 'warning', message: 'Warning' }),
      makeToast({ id: 4, type: 'info', message: 'Info' }),
    ];
    render(<ToastContainer toasts={toasts} onDismiss={vi.fn()} />);
    expect(screen.getByText('Success')).toBeDefined();
    expect(screen.getByText('Error')).toBeDefined();
    expect(screen.getByText('Warning')).toBeDefined();
    expect(screen.getByText('Info')).toBeDefined();
  });

  it('calls onDismiss when clicking dismiss button', () => {
    const onDismiss = vi.fn();
    const toasts = [makeToast({ id: 99, message: 'Dismiss me' })];
    const { container } = render(<ToastContainer toasts={toasts} onDismiss={onDismiss} />);
    const closeBtn = container.querySelector('.toast-close');
    fireEvent.click(closeBtn!);
    expect(onDismiss).toHaveBeenCalledWith(99);
  });
});
