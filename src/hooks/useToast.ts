import { useState, useCallback, useRef } from 'react';
import type { Toast, ToastType } from '../types/toast';

let toastId = 0;

/**
 * Toast notification hook.
 * Provides success, error, warning, and info toasts with auto-dismiss.
 */
export function useToast() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timersRef = useRef<Map<number, ReturnType<typeof setTimeout>>>(new Map());

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
  }, []);

  const addToast = useCallback(
    (message: string, type: ToastType = 'info', duration: number = 3000): number => {
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

  const success = useCallback((msg: string) => addToast(msg, 'success', 3000), [addToast]);
  const error = useCallback((msg: string) => addToast(msg, 'error', 5000), [addToast]);
  const warning = useCallback((msg: string) => addToast(msg, 'warning', 4000), [addToast]);
  const info = useCallback((msg: string) => addToast(msg, 'info', 3000), [addToast]);

  return { toasts, dismiss, success, error, warning, info };
}
