import { describe, expect, it } from 'vitest';
import type { Tab } from '../../types/tab';
import {
  createSessionSnapshot,
  loadRecoverySession,
  MAX_RECOVERY_CHARACTERS,
  persistSession,
  SESSION_STORAGE_KEY,
} from '../../utils/sessionManager';

function tab(overrides: Partial<Tab> = {}): Tab {
  return {
    id: 1,
    path: '/draft.md',
    filename: 'draft.md',
    content: 'unsaved',
    savedContent: 'saved',
    isDirty: true,
    ...overrides,
  };
}

function memoryStorage(initial: Record<string, string> = {}) {
  const values = new Map(Object.entries(initial));
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => { values.set(key, value); },
    value: (key: string) => values.get(key),
  };
}

describe('sessionManager', () => {
  it('restores dirty tabs after an unclean shutdown', () => {
    const storage = memoryStorage();
    persistSession({ tabs: [tab()], activeId: 1 }, false, storage);

    const recovery = loadRecoverySession(storage);

    expect(recovery.state?.tabs).toEqual([tab()]);
    expect(recovery.state?.activeId).toBe(1);
    expect(recovery.incomplete).toBe(false);
  });

  it('does not restore a clean exit or a session without dirty work', () => {
    const cleanExit = memoryStorage();
    persistSession({ tabs: [tab()], activeId: 1 }, true, cleanExit);
    const noDirtyWork = memoryStorage();
    persistSession({ tabs: [tab({ content: 'saved', isDirty: false })], activeId: 1 }, false, noDirtyWork);

    expect(loadRecoverySession(cleanExit).state).toBeNull();
    expect(loadRecoverySession(noDirtyWork).state).toBeNull();
  });

  it('rejects corrupt, unsupported, duplicate, and invalid snapshots', () => {
    const corrupt = memoryStorage({ [SESSION_STORAGE_KEY]: '{bad json' });
    const unsupported = memoryStorage({
      [SESSION_STORAGE_KEY]: JSON.stringify({ version: 2, cleanExit: false, tabs: [tab()], activeId: 1 }),
    });
    const duplicates = memoryStorage({
      [SESSION_STORAGE_KEY]: JSON.stringify({
        version: 1,
        cleanExit: false,
        tabs: [tab(), tab({ filename: 'duplicate.md' })],
        activeId: 1,
      }),
    });
    const invalid = memoryStorage({
      [SESSION_STORAGE_KEY]: JSON.stringify({ version: 1, cleanExit: false, tabs: [{ id: 'wrong' }], activeId: 1 }),
    });

    expect(loadRecoverySession(corrupt).state).toBeNull();
    expect(loadRecoverySession(unsupported).state).toBeNull();
    expect(loadRecoverySession(duplicates).state).toBeNull();
    expect(loadRecoverySession(invalid).state).toBeNull();
  });

  it('never truncates document content when applying the recovery size bound', () => {
    const oversized = tab({ content: 'x'.repeat(MAX_RECOVERY_CHARACTERS + 1), savedContent: '' });

    const snapshot = createSessionSnapshot([oversized, tab({ id: 2 })], 1, false, 123);

    expect(snapshot.incomplete).toBe(true);
    expect(snapshot.tabs).toEqual([tab({ id: 2 })]);
    expect(snapshot.activeId).toBe(2);
    expect(snapshot.updatedAt).toBe(123);
  });

  it('returns false rather than throwing when storage is unavailable', () => {
    const storage = {
      getItem: () => null,
      setItem: () => { throw new Error('quota exceeded'); },
    };
    expect(persistSession({ tabs: [tab()], activeId: 1 }, false, storage)).toBe(false);
  });
});
