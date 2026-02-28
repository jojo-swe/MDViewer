import { useState, useCallback, useRef } from 'react';

let toastId = 0;

/**
 * Toast notification hook.
 * Provides success, error, warning, and info toasts with auto-dismiss.
 */
export function useToast() {
  const [toasts, setToasts] = useState([]);
  const timersRef = useRef(new Map());

  const dismiss = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message, type = 'info', duration = 3000) => {
      const id = ++toastId;
      setToasts((prev) => [...prev, { id, message, type }]);

      if (duration > 0) {
        const timer = setTimeout(() => dismiss(id), duration);
        timersRef.current.set(id, timer);
      }

      return id;
    },
    [dismiss]
  );

  const success = useCallback((msg) => addToast(msg, 'success', 3000), [addToast]);
  const error = useCallback((msg) => addToast(msg, 'error', 5000), [addToast]);
  const warning = useCallback((msg) => addToast(msg, 'warning', 4000), [addToast]);
  const info = useCallback((msg) => addToast(msg, 'info', 3000), [addToast]);

  return { toasts, dismiss, success, error, warning, info };
}
