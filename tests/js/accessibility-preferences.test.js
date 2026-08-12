import { describe, expect, it } from 'vitest';
import {
  ACCESSIBILITY_PREFERENCES_VERSION,
  ACCESSIBILITY_STORAGE_KEY,
  DEFAULT_ACCESSIBILITY_PREFERENCES,
  loadAccessibilityPreferences,
  parseAccessibilityPreferences,
  resetAccessibilityPreferences,
  saveAccessibilityPreferences,
} from '../../src/js/core/accessibility-preferences.js';

const enabledPreferences = {
  version: 2,
  enabled: true,
  scale: '150',
  theme: 'black-white',
  font: 'sans',
  letterSpacing: 'medium',
  lineHeight: 'large',
  paragraphSpacing: 'large',
  images: 'hidden',
  speechAnnouncements: false,
};

const v1Preferences = {
  version: 1,
  enabled: true,
  scale: '150',
  theme: 'white-black',
  font: 'sans',
  letterSpacing: 'medium',
  lineHeight: 'large',
  paragraphSpacing: 'large',
  images: 'hidden',
};

describe('accessibility preferences', () => {
  it('exposes the exact frozen default preferences', () => {
    expect(ACCESSIBILITY_STORAGE_KEY).toBe('accessibility-preferences');
    expect(ACCESSIBILITY_PREFERENCES_VERSION).toBe(2);
    expect(DEFAULT_ACCESSIBILITY_PREFERENCES).toEqual({
      version: 2,
      enabled: false,
      scale: '100',
      theme: 'standard',
      font: 'site',
      letterSpacing: 'standard',
      lineHeight: 'standard',
      paragraphSpacing: 'standard',
      images: 'visible',
      speechAnnouncements: false,
    });
    expect(Object.isFrozen(DEFAULT_ACCESSIBILITY_PREFERENCES)).toBe(true);
  });

  it('round-trips valid preferences through storage', () => {
    const values = new Map();
    const storage = {
      get: (key) => values.get(key) ?? null,
      set: (key, value) => { values.set(key, value); return true; },
      remove: (key) => values.delete(key),
    };

    expect(saveAccessibilityPreferences(storage, enabledPreferences)).toBe(true);
    expect(values.get(ACCESSIBILITY_STORAGE_KEY)).toBe(JSON.stringify(enabledPreferences));
    expect(loadAccessibilityPreferences(storage)).toEqual(enabledPreferences);
  });

  it.each([
    ['missing speech announcements', Object.fromEntries(Object.entries(enabledPreferences).filter(([key]) => key !== 'speechAnnouncements'))],
    ['non-boolean speech announcements', { ...enabledPreferences, speechAnnouncements: 'false' }],
    ['version 1', v1Preferences],
    ['unknown version', { ...enabledPreferences, version: 3 }],
    ['unknown enum value', { ...enabledPreferences, theme: 'sepia' }],
    ['extra type', { ...enabledPreferences, extra: 'value' }],
    ['array', [enabledPreferences]],
    ['null', null],
  ])('rejects %s', (_, value) => {
    expect(parseAccessibilityPreferences(JSON.stringify(value))).toBeNull();
  });

  it('rejects malformed JSON', () => {
    expect(parseAccessibilityPreferences('{')).toBeNull();
  });

  it('migrates an exact version-1 record to version 2 and persists it', () => {
    const values = new Map([[ACCESSIBILITY_STORAGE_KEY, JSON.stringify(v1Preferences)]]);
    let writes = 0;
    const storage = {
      get: (key) => values.get(key) ?? null,
      set: (key, value) => { writes += 1; values.set(key, value); return true; },
      remove: (key) => values.delete(key),
    };

    expect(loadAccessibilityPreferences(storage)).toEqual({
      ...v1Preferences,
      version: 2,
      speechAnnouncements: false,
    });
    expect(writes).toBe(1);
    expect(JSON.parse(values.get(ACCESSIBILITY_STORAGE_KEY))).toEqual({
      ...v1Preferences,
      version: 2,
      speechAnnouncements: false,
    });
  });

  it('returns a migrated version-2 record when a version-1 storage write is blocked', () => {
    const storage = {
      get: (key) => (key === ACCESSIBILITY_STORAGE_KEY ? JSON.stringify(v1Preferences) : null),
      set: () => false,
    };

    expect(loadAccessibilityPreferences(storage)).toEqual({
      ...v1Preferences,
      version: 2,
      speechAnnouncements: false,
    });
  });

  it.each([
    ['version 1 record with extra keys', { ...v1Preferences, extra: 'value' }],
    ['malformed JSON', '{'],
  ])('fails safely without persisting %s', (_, raw) => {
    let writes = 0;
    const storage = {
      get: (key) => (key === ACCESSIBILITY_STORAGE_KEY ? (typeof raw === 'string' ? raw : JSON.stringify(raw)) : null),
      set: () => { writes += 1; return true; },
    };

    expect(loadAccessibilityPreferences(storage)).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(writes).toBe(0);
  });

  it('migrates the legacy vision mode to persisted version-2 enabled 125 percent preferences', () => {
    const values = new Map([['vision-mode', 'on']]);
    const storage = {
      get: (key) => values.get(key) ?? null,
      set: (key, value) => { values.set(key, value); return true; },
      remove: (key) => values.delete(key),
    };

    expect(loadAccessibilityPreferences(storage)).toEqual({
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      scale: '125',
    });
    expect(JSON.parse(values.get(ACCESSIBILITY_STORAGE_KEY))).toEqual({
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      scale: '125',
    });
    expect(values.has('vision-mode')).toBe(false);
  });

  it('removes the legacy key only after a successful new-format save', () => {
    const removed = [];
    const failingStorage = { set: () => false, remove: (key) => removed.push(key) };
    const workingStorage = { set: () => true, remove: (key) => removed.push(key) };

    expect(saveAccessibilityPreferences(failingStorage, enabledPreferences)).toBe(false);
    expect(removed).toEqual([]);
    expect(saveAccessibilityPreferences(workingStorage, enabledPreferences)).toBe(true);
    expect(removed).toEqual(['vision-mode']);
  });

  it('returns fresh defaults when storage get throws', () => {
    const first = loadAccessibilityPreferences({ get: () => { throw new Error('blocked'); } });
    const second = loadAccessibilityPreferences({ get: () => { throw new Error('blocked'); } });

    expect(first).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(first).not.toBe(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(second).not.toBe(first);
  });

  it('does not consult or overwrite legacy preferences after the current-key read fails', () => {
    const reads = [];
    const writes = [];
    const removals = [];
    const storage = {
      get(key) {
        reads.push(key);
        if (key === ACCESSIBILITY_STORAGE_KEY) throw new Error('blocked');
        return 'on';
      },
      set: (...args) => writes.push(args),
      remove: (key) => removals.push(key),
    };

    const preferences = loadAccessibilityPreferences(storage);

    expect(preferences).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(preferences).not.toBe(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(reads).toEqual([ACCESSIBILITY_STORAGE_KEY]);
    expect(writes).toEqual([]);
    expect(removals).toEqual([]);
  });

  it('handles storage set and remove failures gracefully', () => {
    expect(saveAccessibilityPreferences({ set: () => { throw new Error('blocked'); }, remove: () => true }, enabledPreferences)).toBe(false);
    expect(resetAccessibilityPreferences({ remove: () => { throw new Error('blocked'); } })).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
  });

  it('removes both settings and returns fresh defaults when reset', () => {
    const removed = [];
    const result = resetAccessibilityPreferences({ remove: (key) => removed.push(key) });

    expect(removed).toEqual([ACCESSIBILITY_STORAGE_KEY, 'vision-mode']);
    expect(result).toEqual(DEFAULT_ACCESSIBILITY_PREFERENCES);
    expect(result).not.toBe(DEFAULT_ACCESSIBILITY_PREFERENCES);
  });
});
