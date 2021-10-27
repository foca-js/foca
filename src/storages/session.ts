import { PersistEngine } from './PersistEngine';

export const session: PersistEngine = {
  getItem(key) {
    return Promise.resolve(sessionStorage.getItem(key));
  },
  setItem(key, value) {
    sessionStorage.setItem(key, value);
    return Promise.resolve();
  },
  clear() {
    sessionStorage.clear();
    return Promise.resolve(void 0);
  },
};
