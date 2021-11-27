import { resolve } from '../utils/resolve';
import { StorageEngine } from './StorageEngine';

let cache: Partial<Record<string, string>> = {};

export const memory: StorageEngine = {
  getItem(key) {
    return resolve(() => (cache[key] === void 0 ? null : cache[key]!));
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
