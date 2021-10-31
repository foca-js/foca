import { StorageEngine } from './StorageEngine';

export const session: StorageEngine = {
  getItem(key) {
    return Promise.resolve(sessionStorage.getItem(key));
  },
  setItem(key, value) {
    return Promise.resolve().then(() => {
      sessionStorage.setItem(key, value);
    });
  },
  removeItem(key) {
    return Promise.resolve().then(() => {
      sessionStorage.removeItem(key);
    });
  },
  clear() {
    return Promise.resolve(void 0).then(() => {
      sessionStorage.clear();
    });
  },
};
