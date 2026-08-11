// localStorage helpers with versioned schema

const SCHEMA_VERSION = 'v1';

export function loadJson<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object' && '__v' in parsed) {
      if (parsed.__v === SCHEMA_VERSION) {
        return (parsed.data as T) ?? fallback;
      }
    }
    return fallback;
  } catch {
    return fallback;
  }
}

export function saveJson<T>(key: string, data: T): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify({ __v: SCHEMA_VERSION, data }));
  } catch {
    // Ignore quota errors and private mode
  }
}

export function clearJson(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore
  }
}
