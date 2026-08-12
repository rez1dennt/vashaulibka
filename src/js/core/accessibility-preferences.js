export const ACCESSIBILITY_STORAGE_KEY = 'accessibility-preferences';
export const ACCESSIBILITY_PREFERENCES_VERSION = 2;
export const DEFAULT_ACCESSIBILITY_PREFERENCES = Object.freeze({
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

const V1_KEYS = Object.freeze([
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
const V2_KEYS = Object.freeze([...V1_KEYS, 'speechAnnouncements']);

function freshDefaults() {
  return { ...DEFAULT_ACCESSIBILITY_PREFERENCES };
}

function normalizeWithKeys(value, keys, version) {
  if (!value || Array.isArray(value) || typeof value !== 'object') return null;
  const valueKeys = Object.keys(value);
  if (valueKeys.length !== keys.length || !keys.every((key) => valueKeys.includes(key))) return null;
  if (value.version !== version || typeof value.enabled !== 'boolean') return null;
  if (!Object.entries(CHOICES).every(([key, choices]) => typeof value[key] === 'string' && choices.has(value[key]))) return null;
  return Object.fromEntries(keys.map((key) => [key, value[key]]));
}

function normalizePreferences(value) {
  const normalized = normalizeWithKeys(value, V2_KEYS, ACCESSIBILITY_PREFERENCES_VERSION);
  return normalized && typeof normalized.speechAnnouncements === 'boolean' ? normalized : null;
}

function normalizeV1Preferences(value) {
  return normalizeWithKeys(value, V1_KEYS, 1);
}

const migrateV1 = (value) => ({
  ...Object.fromEntries(V1_KEYS.map((key) => [key, value[key]])),
  version: 2,
  speechAnnouncements: false,
});

function parseRawPreferences(raw) {
  if (typeof raw !== 'string') return null;
  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

function safely(storage, method, ...args) {
  try {
    return storage?.[method]?.(...args);
  } catch {
    return null;
  }
}

export function parseAccessibilityPreferences(raw) {
  return normalizePreferences(parseRawPreferences(raw));
}

export function loadAccessibilityPreferences(storage) {
  const raw = safely(storage, 'get', ACCESSIBILITY_STORAGE_KEY);
  if (raw != null) {
    const value = parseRawPreferences(raw);
    const preferences = normalizePreferences(value);
    if (preferences) return preferences;
    const version1Preferences = normalizeV1Preferences(value);
    if (!version1Preferences) return freshDefaults();
    const migrated = migrateV1(version1Preferences);
    saveAccessibilityPreferences(storage, migrated);
    return migrated;
  }

  if (safely(storage, 'get', LEGACY_STORAGE_KEY) === 'on') {
    const migrated = { ...freshDefaults(), enabled: true, scale: '125' };
    saveAccessibilityPreferences(storage, migrated);
    return migrated;
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
