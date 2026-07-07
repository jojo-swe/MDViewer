import { useEffect, useRef } from 'react';
import { AlertTriangle } from 'lucide-react';
import './ConfirmDialog.css';

interface ConfirmDialogProps {
  visible: boolean;
  title?: string;
  message?: string;
  confirmLabel?: string;
  dangerLabel?: string;
  cancelLabel?: string;
  onConfirm?: () => void;
  onDanger?: () => void;
  onCancel?: () => void;
}

/**
 * Modal confirm dialog for destructive actions (e.g. closing unsaved tabs).
 */
export default function ConfirmDialog({
  visible,
  title = 'Unsaved Changes',
  message = 'Do you want to save your changes before closing?',
  confirmLabel = 'Save',
  dangerLabel = "Don't Save",
  cancelLabel = 'Cancel',
  onConfirm,
  onDanger,
  onCancel,
}: ConfirmDialogProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Trap focus and handle Escape
  useEffect(() => {
    if (!visible) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel?.();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [visible, onCancel]);

  // Auto-focus the save button on open
  useEffect(() => {
    if (visible && dialogRef.current) {
      const btn = dialogRef.current.querySelector('.confirm-btn--primary') as HTMLButtonElement | null;
      btn?.focus();
    }
  }, [visible]);

  if (!visible) return null;

  return (
    <div className="confirm-overlay" onClick={onCancel}>
      <div
        className="confirm-dialog"
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-label={title}
        onClick={(e) => e.stopPropagation()}
        id="confirm-dialog"
      >
        <div className="confirm-header">
          <AlertTriangle size={20} className="confirm-icon" />
          <h3 className="confirm-title">{title}</h3>
        </div>
        <p className="confirm-message">{message}</p>
        <div className="confirm-actions">
          <button className="confirm-btn confirm-btn--ghost" onClick={onCancel}>
            {cancelLabel}
          </button>
          <button className="confirm-btn confirm-btn--danger" onClick={onDanger}>
            {dangerLabel}
          </button>
          <button className="confirm-btn confirm-btn--primary" onClick={onConfirm}>
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
