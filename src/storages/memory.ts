import { StorageEngine } from './StorageEngine';

let cache: Partial<Record<string, string>> = {};

export const memory: StorageEngine = {
  getItem(key) {
    return Promise.resolve(cache[key] === undefined ? null : cache[key]!);
  },
  setItem(key, value) {
    cache[key] = value;
    return Promise.resolve();
  },
  removeItem(key) {
    cache[key] = undefined;
    return Promise.resolve();
  },
  clear() {
    cache = {};
    return Promise.resolve();
  },
};
