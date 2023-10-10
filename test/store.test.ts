import { compose, StoreEnhancer } from 'redux';
import sleep from 'sleep-promise';
import { from, map } from 'rxjs';
import { composeWithDevTools } from '@redux-devtools/extension';
import { defineModel, memoryStorage, store } from '../src';
import { PersistSchema } from '../src/persist/PersistItem';
import { PersistManager } from '../src/persist/PersistManager';
import { basicModel, basicSkipRefreshModel } from './models/basicModel';
import { complexModel } from './models/complexModel';
import {
  hasFilterPersistModel,
  hasVersionPersistModel,
  persistModel,
} from './models/persistModel';

afterEach(() => {
  store.unmount();
  memoryStorage.clear();
  localStorage.clear();
  sessionStorage.clear();
});

const initializeStoreWithMultiplePersist = () => {
  return store.init({
    persist: [
      {
        key: 'test1',
        keyPrefix: 'Test:',
        version: 1,
        engine: memoryStorage,
        models: [basicModel, complexModel],
      },
      {
        key: 'test1',
        keyPrefix: 'Test:',
        version: 1,
        engine: localStorage,
        models: [persistModel],
      },
      {
        key: 'test2',
        keyPrefix: 'Test:',
        version: 1,
        engine: memoryStorage,
        models: [hasVersionPersistModel, hasFilterPersistModel],
      },
    ],
  });
};

test('Store will throw error before initialize', () => {
  expect(() => store.getState()).toThrowError();
});

test('Method replaceReducer is deprecated', () => {
  expect(() =>
    store.replaceReducer(() => {
      return {} as any;
    }),
  ).toThrowError();
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

describe('persist', () => {
  test('Delay to dump data when state changed', async () => {
    initializeStoreWithMultiplePersist();

    await store.onInitialized();

    // @ts-expect-error
    const getTimer = () => store['persister']!.timer;
    let prevTimer: ReturnType<typeof getTimer>;

    expect(getTimer()).toBeUndefined();
    basicModel.plus(1);
    expect(getTimer()).not.toBeUndefined();
    prevTimer = getTimer();
    basicModel.plus(20);
    expect(getTimer()).toBe(prevTimer);
    basicModel.plus(1);
    expect(getTimer()).toBe(prevTimer);

    expect(store['persister']?.collect()[basicModel.name]).not.toBe(
      basicModel.state,
    );
    await sleep(50);
    expect(store['persister']?.collect()[basicModel.name]).toBe(
      basicModel.state,
    );

    expect(getTimer()).toBeUndefined();
    basicModel.plus(1);
    expect(getTimer()).not.toBeUndefined();
    expect(getTimer()).not.toBe(prevTimer);

    expect(store['persister']?.collect()[basicModel.name]).not.toBe(
      basicModel.state,
    );
    await sleep(50);
    expect(store['persister']?.collect()[basicModel.name]).toBe(
      basicModel.state,
    );
  });

  test('Store can define persist with multiple engines', async () => {
    initializeStoreWithMultiplePersist();

    await store.onInitialized();

    expect(JSON.stringify(store['persister']?.collect())).toMatchInlineSnapshot(
      '"{"basic":{"count":0,"hello":"world"},"complex":{"users":{},"ids":[]},"persist":{"counter":0},"persist1":{"counter":56},"persist2":{"counter":1}}"',
    );

    basicModel.plus(1);
    persistModel.plus(103);

    await sleep(50);
    expect(store['persister']?.collect()).toMatchInlineSnapshot(`
    {
      "basic": {
        "count": 1,
        "hello": "world",
      },
      "complex": {
        "ids": [],
        "users": {},
      },
      "persist": {
        "counter": 103,
      },
      "persist1": {
        "counter": 56,
      },
      "persist2": {
        "counter": 1,
      },
    }
  `);
  });

  test('Store can load persist state', async () => {
    await memoryStorage.setItem(
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

    initializeStoreWithMultiplePersist();

    await store.onInitialized();

    expect(basicModel.state).toMatchObject({
      count: 123,
      hello: 'earth',
    });
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

test('duplicate init() will replace persister', async () => {
  store.init();
  await store.onInitialized();
  expect(store['persister']).toBeNull();

  store.init({
    persist: [
      {
        key: 'test',
        version: 2,
        engine: memoryStorage,
        models: [],
      },
    ],
  });
  expect(store['persister']).toBeInstanceOf(PersistManager);
  await store.onInitialized();
  basicModel.plus(1);
  await sleep(100);
  expect(store['persister']!.collect()).toStrictEqual({});

  store.init({
    persist: [
      {
        key: 'test',
        version: 2,
        engine: memoryStorage,
        models: [basicModel],
      },
    ],
  });
  await store.onInitialized();
  basicModel.plus(1);
  await sleep(100);
  expect(store['persister']!.collect()).toStrictEqual({
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
        engine: memoryStorage,
        models: [],
      },
    ],
  });
  await store.onInitialized();
  expect(store['persister']!.collect()).toStrictEqual({});
});

test('Get custom compose', () => {
  const get: (typeof store)['getCompose'] = store['getCompose'].bind(store);

  expect(get(void 0)).toBe(compose);
  expect(get(compose)).toBe(compose);

  const customCompose = (): StoreEnhancer => '' as any;
  expect(get(customCompose)).toBe(customCompose);

  const devtoolsComposer = composeWithDevTools({
    name: 'x',
  });
  expect(get(devtoolsComposer)).toBe(devtoolsComposer);
  expect(get(composeWithDevTools)).toBe(composeWithDevTools);

  expect(get('redux-devtools')).toBe(compose);

  // @ts-expect-error
  globalThis['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] = customCompose;
  expect(get('redux-devtools')).toBe(customCompose);

  const prevEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'production';
  expect(get('redux-devtools')).toBe(compose);
  process.env.NODE_ENV = prevEnv;
});

test('rxjs can observe store', () => {
  store.init();

  const observable = from(store);
  const results: any[] = [];

  const model = defineModel('rxjs', {
    initialState: {
      foo: 0,
      bar: 0,
    },
    reducers: {
      foo(state) {
        state.foo += 1;
      },
      bar(state) {
        state.bar += 1;
      },
    },
  });

  const sub = observable
    .pipe(
      map((state) => {
        return { fromRx: true, ...state[model.name] };
      }),
    )
    .subscribe((state) => {
      results.push(state);
    });

  model.foo();
  model.foo();
  sub.unsubscribe();
  model.bar();

  expect(results).toEqual(
    expect.arrayContaining([
      { foo: 0, bar: 0, fromRx: true },
      { foo: 1, bar: 0, fromRx: true },
      { foo: 2, bar: 0, fromRx: true },
    ]),
  );
});

test('async callback for onInitialized', () => {
  let msg = 'a';
  store.onInitialized(() => {
    msg += 'b';
  });
  msg += 'c';
  store.init();
  expect(msg).toBe('acb');
});

test('sync callback for onInitialized', () => {
  store.init();

  let msg = 'a';
  store.onInitialized(() => {
    msg += 'b';
  });
  msg += 'c';
  expect(msg).toBe('abc');
});
