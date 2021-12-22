import { compose, StoreEnhancer } from 'redux';
import sleep from 'sleep-promise';
import { engines, store } from '../src';
import { PersistSchema } from '../src/persist/PersistItem';
import { PersistManager } from '../src/persist/PersistManager';
import { basicModel, basicSkipRefreshModel } from './models/basicModel';
import { complexModel } from './models/complexModel';
import {
  hasDecodePersistModel,
  hasVersionPersistModel,
  persistModel,
} from './models/persistModel';

afterEach(() => {
  store.unmount();
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

test('Store can initialize many times except production env', async () => {
  store.init();
  store.init();
  expect(() => store.init()).not.toThrowError();

  const oldEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  expect(() => store.init()).toThrowError();
  process.env.NODE_ENV = oldEnv;

  await store.onInitialized();
});

test('Store can define persist with different engine', async () => {
  initializeStoreWithPersist();

  await store.onInitialized();

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

  await store.onInitialized();

  expect(basicModel.state).toMatchObject({
    count: 123,
    hello: 'earth',
  });
});

test('refresh the total state', () => {
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
});

test('duplicate init() will keep state', () => {
  store.init();

  expect(basicModel.state.count).toEqual(0);
  basicModel.plus(1);
  expect(basicModel.state.count).toEqual(1);

  store.init();
  expect(basicModel.state.count).toEqual(1);
});

test('duplicate init() will replace persistor', async () => {
  store.init();
  await store.onInitialized();
  expect(store.persistor).toBeUndefined();

  store.init({
    persist: [
      {
        key: 'test',
        version: 2,
        engine: engines.memoryStorage,
        models: [],
      },
    ],
  });
  expect(store.persistor).toBeInstanceOf(PersistManager);
  await store.onInitialized();
  basicModel.plus(1);
  await sleep(100);
  expect(store.persistor!.collect()).toStrictEqual({});

  store.init({
    persist: [
      {
        key: 'test',
        version: 2,
        engine: engines.memoryStorage,
        models: [basicModel],
      },
    ],
  });
  await store.onInitialized();
  basicModel.plus(1);
  await sleep(100);
  expect(store.persistor!.collect()).toStrictEqual({
    [basicModel.name]: {
      count: 2,
      hello: 'world',
    },
  });

  store.init({
    persist: [
      {
        key: 'test',
        version: 2,
        engine: engines.memoryStorage,
        models: [],
      },
    ],
  });
  await store.onInitialized();
  expect(store.persistor!.collect()).toStrictEqual({});
});

test('Get custom compose', () => {
  // @ts-expect-error
  const get: typeof store.getCompose = store.getCompose.bind(store);

  expect(get(void 0)).toBe(compose);
  expect(get(compose)).toBe(compose);

  const customCompose = (): StoreEnhancer => {
    return '' as any;
  };
  expect(get(customCompose)).toBe(customCompose);

  expect(get('redux-devtools')).toBe(compose);

  // @ts-expect-error
  globalThis['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] = customCompose;
  expect(get('redux-devtools')).toBe(customCompose);

  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  expect(get('redux-devtools')).toBe(compose);
  process.env.NODE_ENV = prevEnv;
});
