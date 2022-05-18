import { compose, StoreEnhancer } from 'redux';
import sleep from 'sleep-promise';
import { from, map } from 'rxjs';
import { composeWithDevTools } from '@redux-devtools/extension';
import { defineModel, engines, store } from '../src';
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
  engines.memoryStorage.clear();
  engines.localStorage.clear();
  engines.sessionStorage.clear();
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

test('Delay to restore data when state changed', async () => {
  initializeStoreWithPersist();

  await store.onInitialized();

  // @ts-expect-error
  const getTimer = () => store.persistor!.timer;
  let prevTimer: ReturnType<typeof getTimer>;

  expect(getTimer()).toBeUndefined();
  basicModel.plus(1);
  expect(getTimer()).not.toBeUndefined();
  prevTimer = getTimer();
  basicModel.plus(20);
  expect(getTimer()).toBe(prevTimer);
  basicModel.plus(1);
  expect(getTimer()).toBe(prevTimer);

  expect(store.persistor?.collect()[basicModel.name]).not.toBe(
    basicModel.state,
  );
  await sleep(50);
  expect(store.persistor?.collect()[basicModel.name]).toBe(basicModel.state);

  expect(getTimer()).toBeUndefined();
  basicModel.plus(1);
  expect(getTimer()).not.toBeUndefined();
  expect(getTimer()).not.toBe(prevTimer);

  expect(store.persistor?.collect()[basicModel.name]).not.toBe(
    basicModel.state,
  );
  await sleep(50);
  expect(store.persistor?.collect()[basicModel.name]).toBe(basicModel.state);
});

test('Store can define persist with different engine', async () => {
  initializeStoreWithPersist();

  await store.onInitialized();

  expect(JSON.stringify(store.persistor?.collect())).toBe('{}');

  basicModel.plus(1);

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

it('rxjs can observe store', () => {
  store.init();

  const observable = from(store);
  const results: any[] = [];

  const model = defineModel('rxjs', {
    initialState: {
      foo: 0,
      bar: 0,
    },
    actions: {
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
