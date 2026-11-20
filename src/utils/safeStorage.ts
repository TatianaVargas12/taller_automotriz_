/**
 * Safe localStorage wrapper with try/catch fallback for private browsing,
 * iframe sandboxes, and quota exceptions.
 */

const memoryStore: Record<string, string> = {};

export const safeStorage = {
  getItem(key: string, fallback: string | null = null): string | null {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const val = window.localStorage.getItem(key);
        return val !== null ? val : fallback;
      }
    } catch {
      // In case localStorage access is blocked (e.g. security policy, private mode)
    }
    return memoryStore[key] !== undefined ? memoryStore[key] : fallback;
  },

  setItem(key: string, value: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(key, value);
      }
    } catch {
      // In case localStorage quota is exceeded or blocked
    }
    memoryStore[key] = value;
  },

  removeItem(key: string): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.removeItem(key);
      }
    } catch {
      // Ignore
    }
    delete memoryStore[key];
  },

  getJSON<T>(key: string, fallback: T): T {
    try {
      const raw = safeStorage.getItem(key);
      if (raw) {
        return JSON.parse(raw) as T;
      }
    } catch {
      // Fallback on JSON parse error
    }
    return fallback;
  },

  setJSON<T>(key: string, value: T): void {
    try {
      safeStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore
    }
  },
};
