import { Topic } from 'topic';
import { store } from '../../src';

export const storeReady = () => {
  return new Promise((resolve) => {
    store.onReady(resolve);
  });
};

export const storeUnmount = () => {
  store.origin = void 0;
  store.persistManager = void 0;
  store.topic = new Topic();
};
