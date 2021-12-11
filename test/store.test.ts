import sleep from 'sleep-promise';
import { engines, store } from '../src';
import { PersistSchema } from '../src/persist/PersistItem';
import { basicModel, basicSkipRefreshModel } from './models/basicModel';
import { complexModel } from './models/complexModel';
import {
  hasDecodePersistModel,
  hasVersionPersistModel,
  persistModel,
} from './models/persistModel';
import { storeReady, storeUnmount } from './utils/store';

afterEach(() => {
  storeUnmount();
});

const initializeStoreWithPersist = () => {
  return store.init({
    persist: [
      {
        key: 'test1',
        keyPrefix: 'Test:',
        version: 1,
        engine: engines.memoryStorage,
        models: [basicModel, complexModel],
      },
      {
        key: 'test1',
        keyPrefix: 'Test:',
        version: 1,
        engine: engines.localStorage,
        models: [persistModel],
      },
      {
        key: 'test2',
        keyPrefix: 'Test:',
        version: 1,
        engine: engines.memoryStorage,
        models: [hasVersionPersistModel, hasDecodePersistModel],
      },
    ],
  });
};

test('Store will throw error before initialize', () => {
  expect(() => store.getState()).toThrowError();
});

test('Method replaceReducer is deprecated', () => {
  expect(() => store.replaceReducer()).toThrowError();
});

test('Store can only initialize once', () => {
  store.init();
  expect(() => store.init()).toThrowError();
});

test('Store can define persist with different engine', async () => {
  initializeStoreWithPersist();

  await storeReady();

  expect(JSON.stringify(store.persistor?.collect())).toBe('{}');

  const spy = jest.spyOn(globalThis, 'clearTimeout');
  expect(spy).toHaveBeenCalledTimes(0);
  basicModel.plus(1);
  expect(spy).toHaveBeenCalledTimes(1);
  basicModel.plus(20);
  expect(spy).toHaveBeenCalledTimes(2);
  basicModel.plus(1);
  expect(spy).toHaveBeenCalledTimes(3);
  spy.mockRestore();

  await sleep(50);
  expect(store.persistor?.collect()).toMatchObject({
    [basicModel.name]: basicModel.state,
    [persistModel.name]: persistModel.state,
    [hasVersionPersistModel.name]: hasVersionPersistModel.state,
    [hasDecodePersistModel.name]: hasDecodePersistModel.state,
  });
});

test('Store can hydrate persist state', async () => {
  await engines.memoryStorage.setItem(
    'Test:test1',
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [basicModel.name]: {
          v: 0,
          t: Date.now(),
          d: JSON.stringify({
            count: 123,
            hello: 'earth',
          }),
        },
      },
    }),
  );

  initializeStoreWithPersist();

  await storeReady();

  expect(basicModel.state).toMatchObject({
    count: 123,
    hello: 'earth',
  });
});

test('refresh the whole state', () => {
  store.init();

  basicModel.plus(1);
  basicSkipRefreshModel.plus(1);
  expect(basicModel.state.count).toEqual(1);
  expect(basicSkipRefreshModel.state.count).toEqual(1);

  store.refresh();
  expect(basicModel.state.count).toEqual(0);
  expect(basicSkipRefreshModel.state.count).toEqual(1);

  basicModel.plus(1);
  basicSkipRefreshModel.plus(1);
  expect(basicModel.state.count).toEqual(1);
  expect(basicSkipRefreshModel.state.count).toEqual(2);

  store.refresh(true);
  expect(basicModel.state.count).toEqual(0);
  expect(basicSkipRefreshModel.state.count).toEqual(0);

  storeUnmount();
});
