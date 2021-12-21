import { resolve } from '../utils/resolve';
import type { StorageEngine } from './StorageEngine';

export const session: StorageEngine = {
  getItem(key) {
    return resolve(() => sessionStorage.getItem(key));
  },
  setItem(key, value) {
    return resolve(() => {
      sessionStorage.setItem(key, value);
    });
  },
  removeItem(key) {
    return resolve(() => {
      sessionStorage.removeItem(key);
    });
  },
  clear() {
    return resolve(() => {
      sessionStorage.clear();
    });
  },
};
