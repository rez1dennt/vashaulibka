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
  version: 1,
  enabled: true,
  scale: '150',
  theme: 'black-white',
  font: 'sans',
  letterSpacing: 'medium',
  lineHeight: 'large',
  paragraphSpacing: 'large',
  images: 'hidden',
};

describe('accessibility preferences', () => {
  it('exposes the exact frozen default preferences', () => {
    expect(ACCESSIBILITY_STORAGE_KEY).toBe('accessibility-preferences');
    expect(ACCESSIBILITY_PREFERENCES_VERSION).toBe(1);
    expect(DEFAULT_ACCESSIBILITY_PREFERENCES).toEqual({
      version: 1,
      enabled: false,
      scale: '100',
      theme: 'standard',
      font: 'site',
      letterSpacing: 'standard',
      lineHeight: 'standard',
      paragraphSpacing: 'standard',
      images: 'visible',
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
    ['unknown version', { ...enabledPreferences, version: 2 }],
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

  it('migrates the legacy vision mode to enabled 125 percent preferences', () => {
    const storage = { get: (key) => (key === 'vision-mode' ? 'on' : null) };

    expect(loadAccessibilityPreferences(storage)).toEqual({
      ...DEFAULT_ACCESSIBILITY_PREFERENCES,
      enabled: true,
      scale: '125',
    });
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
