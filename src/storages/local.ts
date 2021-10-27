import { PersistStorage } from '../store/PersistStorage';

const local: PersistStorage = {
  getItem(key) {
    return Promise.resolve(localStorage.getItem(key));
  },
  setItem(key, value) {
    return Promise.resolve(localStorage.setItem(key, value));
  },
};

export default local;
