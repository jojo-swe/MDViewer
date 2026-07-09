import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useRef } from 'react';
import { useSyncScroll } from '../../hooks/useSyncScroll';

function createMockElement(scrollHeight = 1000, clientHeight = 200): HTMLElement {
  const el = {
    scrollHeight,
    clientHeight,
    scrollTop: 0,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  } as unknown as HTMLElement;
  return el;
}

describe('useSyncScroll', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('does not attach listeners when disabled', () => {
    const source = createMockElement();
    const preview = createMockElement();

    const { rerender } = renderHook(
      ({ enabled }) => {
        const sourceRef = useRef<HTMLElement | null>(source);
        const previewRef = useRef<HTMLElement | null>(preview);
        useSyncScroll(sourceRef, previewRef, { enabled });
      },
      { initialProps: { enabled: false } }
    );

    expect(source.addEventListener).not.toHaveBeenCalled();
    expect(preview.addEventListener).not.toHaveBeenCalled();

    rerender({ enabled: false });
  });

  it('attaches scroll listeners when enabled', () => {
    const source = createMockElement();
    const preview = createMockElement();

    renderHook(
      ({ enabled }) => {
        const sourceRef = useRef<HTMLElement | null>(source);
        const previewRef = useRef<HTMLElement | null>(preview);
        useSyncScroll(sourceRef, previewRef, { enabled });
      },
      { initialProps: { enabled: true } }
    );

    expect(source.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(preview.addEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });

  it('removes listeners on cleanup', () => {
    const source = createMockElement();
    const preview = createMockElement();

    const { unmount } = renderHook(
      () => {
        const sourceRef = useRef<HTMLElement | null>(source);
        const previewRef = useRef<HTMLElement | null>(preview);
        useSyncScroll(sourceRef, previewRef, { enabled: true });
      }
    );

    unmount();

    expect(source.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
    expect(preview.removeEventListener).toHaveBeenCalledWith('scroll', expect.any(Function));
  });
});
