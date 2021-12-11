import { Topic } from 'topic';
import { store } from '../../src';
import { actionRefresh } from '../../src/actions/refresh';
import { metaStore } from '../../src/store/metaStore';

export const storeReady = () => {
  return new Promise((resolve) => {
    store.onReady(resolve);
  });
};

export const storeUnmount = () => {
  store.origin = void 0;
  store.persistor = void 0;
  store.topic = new Topic();
  metaStore.dispatch(actionRefresh(true));
};
