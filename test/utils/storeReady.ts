import { store } from '../../src';

export const storeReady = () => {
  return new Promise((resolve) => {
    store.onReady(resolve);
  });
};
