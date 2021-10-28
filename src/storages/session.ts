import { StorageEngine } from './StorageEngine';

export const session: StorageEngine = {
  getItem(key) {
    return Promise.resolve(sessionStorage.getItem(key));
  },
  setItem(key, value) {
    sessionStorage.setItem(key, value);
    return Promise.resolve();
  },
  removeItem(key) {
    sessionStorage.removeItem(key);
    return Promise.resolve();
  },
  clear() {
    sessionStorage.clear();
    return Promise.resolve(void 0);
  },
};
