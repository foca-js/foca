import type { StorageEngine } from '../../src';
import { toPromise } from '../../src/utils/to-promise';

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
    return toPromise(() => {
      cache[key] = value;
    });
  },
  removeItem(key) {
    return toPromise(() => {
      cache[key] = void 0;
    });
  },
  clear() {
    return toPromise(() => {
      cache = {};
    });
  },
};
