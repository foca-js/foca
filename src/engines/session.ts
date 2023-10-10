import type { StorageEngine } from './StorageEngine';

export const session: StorageEngine = {
  getItem(key) {
    return sessionStorage.getItem(key);
  },
  setItem(key, value) {
    sessionStorage.setItem(key, value);
  },
  removeItem(key) {
    sessionStorage.removeItem(key);
  },
  clear() {
    sessionStorage.clear();
  },
};
