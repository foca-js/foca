import { StorageEngine } from './StorageEngine';

let cache: Record<string, string> = {};

export const memory: StorageEngine = {
  getItem(key) {
    return Promise.resolve(cache[key] === undefined ? null : cache[key]!);
  },
  setItem(key, value) {
    cache[key] = value;
    return Promise.resolve();
  },
  clear() {
    cache = {};
    return Promise.resolve();
  },
};
