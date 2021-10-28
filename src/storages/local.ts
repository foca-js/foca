import { StorageEngine } from './StorageEngine';

export const local: StorageEngine = {
  getItem(key) {
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem(key, value) {
    localStorage.setItem(key, value);
    return Promise.resolve();
  },
  clear() {
    localStorage.clear();
    return Promise.resolve();
  },
};
