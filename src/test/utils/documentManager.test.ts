import { describe, expect, it, vi } from 'vitest';
import type { Tab } from '../../types/tab';
import { saveDocument, type DocumentPersistence } from '../../utils/documentManager';

const tab: Tab = {
  id: 7,
  path: '/docs/example.md',
  filename: 'example.md',
  content: 'current',
  savedContent: 'saved',
  isDirty: true,
};

function persistence(overrides: Partial<DocumentPersistence> = {}): DocumentPersistence {
  return {
    save: vi.fn().mockResolvedValue({ status: 'saved', path: '/docs/example.md' }),
    saveAs: vi.fn().mockResolvedValue('/docs/new.md'),
    ...overrides,
  };
}

describe('saveDocument', () => {
  it('saves an existing file using the supplied tab snapshot', async () => {
    const adapter = persistence();

    const result = await saveDocument(tab, 'snapshot', {}, adapter);

    expect(adapter.save).toHaveBeenCalledWith('/docs/example.md', 'snapshot', 'saved');
    expect(adapter.saveAs).not.toHaveBeenCalled();
    expect(result).toEqual({ status: 'saved', path: '/docs/example.md', content: 'snapshot' });
  });

  it('uses Save As for an untitled document or when forced', async () => {
    const adapter = persistence();

    await saveDocument({ ...tab, path: null }, 'untitled', {}, adapter);
    await saveDocument(tab, 'copy', { forceSaveAs: true }, adapter);

    expect(adapter.saveAs).toHaveBeenNthCalledWith(1, 'untitled');
    expect(adapter.saveAs).toHaveBeenNthCalledWith(2, 'copy');
  });

  it('reports cancellation without treating it as success', async () => {
    const adapter = persistence({ saveAs: vi.fn().mockResolvedValue(null) });

    const result = await saveDocument({ ...tab, path: null }, 'draft', {}, adapter);

    expect(result).toEqual({ status: 'cancelled' });
  });

  it('reports an external-change conflict without attempting Save As', async () => {
    const adapter = persistence({
      save: vi.fn().mockResolvedValue({
        status: 'conflict',
        reason: 'changed',
        diskContent: 'external edit',
      }),
    });

    const result = await saveDocument(tab, 'my edit', {}, adapter);

    expect(result).toEqual({
      status: 'conflict',
      reason: 'changed',
      diskContent: 'external edit',
    });
    expect(adapter.saveAs).not.toHaveBeenCalled();
  });

  it('returns failures instead of throwing', async () => {
    const error = new Error('disk full');
    const adapter = persistence({ save: vi.fn().mockRejectedValue(error) });

    const result = await saveDocument(tab, 'snapshot', {}, adapter);

    expect(result).toEqual({ status: 'failed', error });
  });
});
