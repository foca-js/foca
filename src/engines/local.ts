import { resolve } from '../utils/resolve';
import type { StorageEngine } from './StorageEngine';

export const local: StorageEngine = {
  getItem(key) {
    return resolve(() => localStorage.getItem(key));
  },
  setItem(key, value) {
    return resolve(() => {
      localStorage.setItem(key, value);
    });
  },
  removeItem(key) {
    return resolve(() => {
      localStorage.removeItem(key);
    });
  },
  clear() {
    return resolve(() => {
      localStorage.clear();
    });
  },
};
