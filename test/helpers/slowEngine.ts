import type { StorageEngine } from '../../src';
import { resolve } from '../../src/utils/resolve';

let cache: Partial<Record<string, string>> = {};

export const slowEngine: StorageEngine = {
  getItem(key) {
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(cache[key] === void 0 ? null : cache[key]!);
      }, 300);
    });
  },
  setItem(key, value) {
    return resolve(() => {
      cache[key] = value;
    });
  },
  removeItem(key) {
    return resolve(() => {
      cache[key] = void 0;
    });
  },
  clear() {
    return resolve(() => {
      cache = {};
    });
  },
};
