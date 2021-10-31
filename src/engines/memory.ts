import { StorageEngine } from './StorageEngine';

let cache: Partial<Record<string, string>> = {};

export const memory: StorageEngine = {
  getItem(key) {
    return Promise.resolve(cache[key] === undefined ? null : cache[key]!);
  },
  setItem(key, value) {
    return Promise.resolve().then(() => {
      cache[key] = value;
    });
  },
  removeItem(key) {
    return Promise.resolve().then(() => {
      cache[key] = undefined;
    });
  },
  clear() {
    return Promise.resolve().then(() => {
      cache = {};
    });
  },
};
