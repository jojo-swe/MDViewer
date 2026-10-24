import { act, render, waitFor } from '@testing-library/react';
import { createRef } from 'react';
import { describe, expect, it, vi } from 'vitest';
import MilkdownEditor, { type EditorInstance } from '../../components/MilkdownEditor';

const crepeState = vi.hoisted(() => ({
  options: [] as Array<{ defaultValue: string }>,
  destroy: vi.fn(),
  markdownUpdated: null as ((ctx: unknown, markdown: string) => void) | null,
  markdown: '',
}));

vi.mock('@milkdown/crepe', () => {
  class Crepe {
    static Feature = { Latex: 'latex' };
    private readonly value: string;

    constructor(options: { defaultValue: string }) {
      this.value = options.defaultValue;
      crepeState.markdown = options.defaultValue;
      crepeState.options.push(options);
    }

    on(register: (listener: { markdownUpdated: (callback: (ctx: unknown, markdown: string) => void) => void }) => void) {
      register({ markdownUpdated: (callback) => { crepeState.markdownUpdated = callback; } });
    }

    async create() {
      await Promise.resolve();
    }

    destroy() {
      crepeState.destroy();
    }

    getMarkdown() {
      return crepeState.markdown || this.value;
    }
  }

  return { Crepe };
});

describe('MilkdownEditor lifecycle', () => {
  it('initializes directly from opened content without reporting it as a user edit', async () => {
    const onMarkdownChange = vi.fn();
    const editorRef = createRef<EditorInstance>() as React.MutableRefObject<EditorInstance | null>;

    const view = render(
      <MilkdownEditor
        theme="dark"
        externalContent="recovered draft"
        onMarkdownChange={onMarkdownChange}
        editorInstanceRef={editorRef}
      />
    );

    await waitFor(() => expect(editorRef.current).not.toBeNull());
    expect(crepeState.options[crepeState.options.length - 1]?.defaultValue).toBe('recovered draft');
    expect(onMarkdownChange).not.toHaveBeenCalled();

    act(() => view.unmount());
    expect(editorRef.current).toBeNull();
  });

  it('does not destroy and recreate the editor for its own user update', async () => {
    crepeState.destroy.mockClear();
    const onMarkdownChange = vi.fn();
    const editorRef = createRef<EditorInstance>() as React.MutableRefObject<EditorInstance | null>;
    const view = render(
      <MilkdownEditor
        theme="dark"
        externalContent="before"
        onMarkdownChange={onMarkdownChange}
        editorInstanceRef={editorRef}
      />
    );
    await waitFor(() => expect(editorRef.current).not.toBeNull());

    crepeState.markdown = 'after typing';
    act(() => crepeState.markdownUpdated?.({}, 'after typing'));
    expect(onMarkdownChange).toHaveBeenCalledWith('after typing');
    view.rerender(
      <MilkdownEditor
        theme="dark"
        externalContent="after typing"
        onMarkdownChange={onMarkdownChange}
        editorInstanceRef={editorRef}
      />
    );

    expect(crepeState.destroy).not.toHaveBeenCalled();
  });
});
