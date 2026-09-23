import type { StateStorage } from "zustand/middleware";

// Returns `fallback` when the storage throws.
const attempt = <T>(access: () => T, fallback: T) => {
  try {
    return access();
  } catch {
    return fallback;
  }
};

// Browser storage can be unavailable: blocked site data, a sandboxed frame, a full quota. Reading
// it, or even `window.localStorage` itself, then throws. Here every access fails silently: a
// persisted store keeps its defaults, and its changes only last for the visit.
export const safeStorage = (getStorage: () => Storage): StateStorage => ({
  getItem: (name) => attempt(() => getStorage().getItem(name), null),
  setItem: (name, value) => attempt(() => getStorage().setItem(name, value), undefined),
  removeItem: (name) => attempt(() => getStorage().removeItem(name), undefined),
});
