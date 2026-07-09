import { useEffect, useRef, useCallback } from 'react';

interface SyncScrollOptions {
  enabled: boolean;
}

/**
 * Synchronizes scroll position between two panes (source and preview) in split view.
 * Uses proportional scroll mapping with debounce to avoid feedback loops.
 */
export function useSyncScroll(
  sourceRef: React.RefObject<HTMLElement | null>,
  previewRef: React.RefObject<HTMLElement | null>,
  { enabled }: SyncScrollOptions
) {
  const isSyncingRef = useRef(false);
  const rafIdRef = useRef<number | null>(null);

  const handleScroll = useCallback(
    (source: HTMLElement, target: HTMLElement) => {
      if (isSyncingRef.current) return;
      isSyncingRef.current = true;

      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }

      rafIdRef.current = requestAnimationFrame(() => {
        const sourceMax = source.scrollHeight - source.clientHeight;
        const targetMax = target.scrollHeight - target.clientHeight;

        if (sourceMax > 0 && targetMax > 0) {
          const ratio = source.scrollTop / sourceMax;
          target.scrollTop = ratio * targetMax;
        }

        isSyncingRef.current = false;
        rafIdRef.current = null;
      });
    },
    []
  );

  useEffect(() => {
    if (!enabled) return;

    const source = sourceRef.current;
    const preview = previewRef.current;
    if (!source || !preview) return;

    const onSourceScroll = () => handleScroll(source, preview);
    const onPreviewScroll = () => handleScroll(preview, source);

    source.addEventListener('scroll', onSourceScroll);
    preview.addEventListener('scroll', onPreviewScroll);

    return () => {
      source.removeEventListener('scroll', onSourceScroll);
      preview.removeEventListener('scroll', onPreviewScroll);
      if (rafIdRef.current !== null) {
        cancelAnimationFrame(rafIdRef.current);
      }
    };
  }, [enabled, sourceRef, previewRef, handleScroll]);
}
