import { StorageEngine } from './StorageEngine';

export const local: StorageEngine = {
  getItem(key) {
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem(key, value) {
    return Promise.resolve().then(() => {
      localStorage.setItem(key, value);
    });
  },
  removeItem(key) {
    return Promise.resolve().then(() => {
      localStorage.removeItem(key);
    });
  },
  clear() {
    return Promise.resolve().then(() => {
      localStorage.clear();
    });
  },
};
