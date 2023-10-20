import type { StorageEngine } from './storage-engine';

let cache: Partial<Record<string, string>> = {};

export const memoryStorage: StorageEngine = {
  getItem(key) {
    return cache[key] === void 0 ? null : cache[key]!;
  },
  setItem(key, value) {
    cache[key] = value;
  },
  removeItem(key) {
    cache[key] = void 0;
  },
  clear() {
    cache = {};
  },
};
