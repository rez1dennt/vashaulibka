export const ACCESSIBILITY_STORAGE_KEY = 'accessibility-preferences';
export const ACCESSIBILITY_PREFERENCES_VERSION = 1;
export const DEFAULT_ACCESSIBILITY_PREFERENCES = Object.freeze({
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

const LEGACY_STORAGE_KEY = 'vision-mode';
const CHOICES = Object.freeze({
  scale: new Set(['100', '125', '150', '200']),
  theme: new Set(['standard', 'black-white', 'white-black', 'blue-light']),
  font: new Set(['site', 'sans']),
  letterSpacing: new Set(['standard', 'medium', 'large']),
  lineHeight: new Set(['standard', 'medium', 'large']),
  paragraphSpacing: new Set(['standard', 'large']),
  images: new Set(['visible', 'hidden']),
});

const REQUIRED_KEYS = Object.freeze([
  'version',
  'enabled',
  'scale',
  'theme',
  'font',
  'letterSpacing',
  'lineHeight',
  'paragraphSpacing',
  'images',
]);

function freshDefaults() {
  return { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
}

function normalizePreferences(value) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const keys = Object.keys(value);
  if (keys.length !== REQUIRED_KEYS.length || !REQUIRED_KEYS.every((key) => keys.includes(key))) return null;
  if (value.version !== ACCESSIBILITY_PREFERENCES_VERSION || typeof value.enabled !== 'boolean') return null;
  if (!Object.entries(CHOICES).every(([key, choices]) => typeof value[key] === 'string' && choices.has(value[key]))) return null;
  return Object.fromEntries(REQUIRED_KEYS.map((key) => [key, value[key]]));
}

function safely(storage, method, ...args) {
  try {
    return storage?.[method]?.(...args);
  } catch {
    return null;
  }
}

export function parseAccessibilityPreferences(raw) {
  if (typeof raw !== 'string') return null;
  try {
    return normalizePreferences(JSON.parse(raw));
  } catch {
    return null;
  }
}

export function loadAccessibilityPreferences(storage) {
  const preferences = parseAccessibilityPreferences(safely(storage, 'get', ACCESSIBILITY_STORAGE_KEY));
  if (preferences) return preferences;
  if (safely(storage, 'get', LEGACY_STORAGE_KEY) === 'on') {
    return { ...freshDefaults(), enabled: true, scale: '125' };
  }
  return freshDefaults();
}

export function saveAccessibilityPreferences(storage, preferences) {
  const normalized = normalizePreferences(preferences);
  if (!normalized || safely(storage, 'set', ACCESSIBILITY_STORAGE_KEY, JSON.stringify(normalized)) !== true) return false;
  safely(storage, 'remove', LEGACY_STORAGE_KEY);
  return true;
}

export function resetAccessibilityPreferences(storage) {
  safely(storage, 'remove', ACCESSIBILITY_STORAGE_KEY);
  safely(storage, 'remove', LEGACY_STORAGE_KEY);
  return freshDefaults();
}
