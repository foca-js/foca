import sleep from 'sleep-promise';
import { defineModel, engines, Model, StorageEngine, store } from '../src';
import {
  PersistItem,
  PersistMergeMode,
  PersistSchema,
} from '../src/persist/PersistItem';
import { resolve } from '../src/utils/resolve';
import { stringifyState } from '../src/utils/serialize';
import { basicModel } from './models/basicModel';
import {
  hasFilterPersistModel,
  hasVersionPersistModel,
  persistModel,
} from './models/persistModel';

const stringifyTwice = (model: Model) => {
  return JSON.stringify(JSON.stringify(model.state));
};

const createDefaultInstance = () => {
  return new PersistItem({
    version: 1,
    key: 'test-' + Math.random(),
    engine: engines.memoryStorage,
    models: [persistModel],
  });
};

const storageDump = (opts: {
  key: string;
  model: Model;
  state?: object | string;
  persistVersion?: number;
  modelVersion?: number;
  engine?: StorageEngine;
}) => {
  const {
    key,
    model,
    state = model.state,
    persistVersion = 1,
    modelVersion = 0,
    engine = engines.memoryStorage,
  } = opts;
  return engine.setItem(
    key,
    JSON.stringify(<PersistSchema>{
      v: persistVersion,
      d: {
        [model.name]: {
          v: modelVersion,
          d: typeof state === 'string' ? state : stringifyState(state),
        },
      },
    }),
  );
};

beforeEach(() => {
  store.init();
});

afterEach(async () => {
  store.unmount();
  await engines.memoryStorage.clear();
});

test('dump state', async () => {
  const persist = createDefaultInstance();

  await expect(engines.memoryStorage.getItem(persist.key)).resolves.toBeNull();

  await persist.init();

  await expect(engines.memoryStorage.getItem(persist.key)).resolves.toBe(
    JSON.stringify(persist),
  );
  await expect(engines.memoryStorage.getItem(persist.key)).resolves.toContain(
    stringifyTwice(persistModel),
  );

  persistModel.plus(15);
  expect(persistModel.state.counter).toBe(15);

  persist.update({
    [persistModel.name]: persistModel.state,
  });

  await sleep(1);

  const value = await engines.memoryStorage.getItem(persist.key);
  expect(value).toBe(JSON.stringify(persist));
  expect(value).toContain(stringifyTwice(persistModel));
});

test('load state', async () => {
  const persist = createDefaultInstance();

  await storageDump({
    key: persist.key,
    model: persistModel,
    state: { counter: 15, extra: undefined },
  });

  await persist.init();

  expect(persist.collect()).toMatchObject({
    [persistModel.name]: {
      counter: 15,
      extra: undefined,
    },
  });
  expect(persist.collect()[persistModel.name]).toHaveProperty(
    'extra',
    undefined,
  );
});

test('load failed due to persist version changed', async () => {
  const persist = createDefaultInstance();

  await storageDump({
    key: persist.key,
    model: persistModel,
    persistVersion: 20,
    state: { counter: 100 },
  });
  await persist.init();

  expect(persist.collect()).toStrictEqual({
    [persistModel.name]: { counter: 0 },
  });
});

test('load failed due to model version changed', async () => {
  const persist = createDefaultInstance();

  await storageDump({
    key: persist.key,
    model: persistModel,
    modelVersion: 17,
    state: { counter: 100 },
  });

  await persist.init();

  expect(persist.collect()).toStrictEqual({
    [persistModel.name]: { counter: 0 },
  });
});

test('load failed due to invalid JSON literal', async () => {
  let persist = createDefaultInstance();

  await storageDump({
    key: persist.key,
    model: persistModel,
    state: stringifyState(persistModel.state) + '$$$$',
  });

  await expect(persist.init()).rejects.toThrowError();
  expect(persist.collect()).toStrictEqual({});

  await Promise.resolve();
  await expect(persist.init()).resolves.toBeUndefined();
  expect(persist.collect()).toStrictEqual({
    [persistModel.name]: { counter: 0 },
  });

  persist = createDefaultInstance();
  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [persistModel.name]: {
          t: Date.now(),
          v: 0,
          d: stringifyState(persistModel.state) + '$$$$',
        },
      },
    }) + '$$$$',
  );
  await expect(persist.init()).rejects.toThrowError();
  expect(persist.collect()).toStrictEqual({});

  await Promise.resolve();
  await expect(persist.init()).resolves.toBeUndefined();
  expect(persist.collect()).toStrictEqual({
    [persistModel.name]: { counter: 0 },
  });
});

test('get rid of unregistered model', async () => {
  const persist = new PersistItem({
    version: 1,
    key: 'test1',
    engine: engines.memoryStorage,
    models: [basicModel],
  });

  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [persistModel.name]: {
          t: Date.now(),
          v: 0,
          d: stringifyState(persistModel.state),
        },
        [basicModel.name]: {
          t: Date.now(),
          v: 0,
          d: stringifyState(basicModel.state),
        },
      },
    }),
  );

  await persist.init();

  expect(persist.collect()).toMatchObject({
    [basicModel.name]: basicModel.state,
  });
  expect(persist.collect()).not.toMatchObject({
    [persistModel.name]: persistModel.state,
  });

  const storageValue = await engines.memoryStorage.getItem(persist.key);
  expect(storageValue).toContain(stringifyTwice(basicModel));
  expect(storageValue).not.toContain(stringifyTwice(persistModel));
});

test('model can specific persist version', async () => {
  const persist = new PersistItem({
    version: 1,
    key: 'test1',
    engine: engines.memoryStorage,
    models: [persistModel, hasVersionPersistModel],
  });

  await storageDump({
    key: persist.key,
    model: hasVersionPersistModel,
    modelVersion: 10,
  });

  await persist.init();

  expect(persist.collect()).toMatchObject({
    [hasVersionPersistModel.name]: hasVersionPersistModel.state,
  });
});

test('model can specific persist filter function', async () => {
  const persist = new PersistItem({
    version: 1,
    key: 'test1',
    engine: engines.memoryStorage,
    models: [persistModel, hasFilterPersistModel],
  });

  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [hasFilterPersistModel.name]: {
          t: Date.now(),
          v: 0,
          d: stringifyState(hasFilterPersistModel.state.counter),
        },
      },
    }),
  );

  await persist.init();

  expect(persist.collect()).toMatchObject({
    [hasFilterPersistModel.name]: { counter: 1 },
  });

  hasFilterPersistModel.plus(100);
  hasFilterPersistModel.plus(5);

  persist.update({
    [hasFilterPersistModel.name]: hasFilterPersistModel.state,
  });

  await sleep(1);
  await expect(engines.memoryStorage.getItem(persist.key)).resolves.toContain(
    '"d":"105"',
  );
});

test('no dump happen before load finished', async () => {
  let cache: Partial<Record<string, string>> = {};
  const customEngine: StorageEngine = {
    async getItem(key) {
      const result = cache[key] === void 0 ? null : cache[key]!;
      await sleep(200);
      return result;
    },
    async setItem(key, value) {
      return resolve(() => {
        cache[key] = value;
      });
    },
    async removeItem(key) {
      return resolve(() => {
        cache[key] = void 0;
      });
    },
    async clear() {
      return resolve(() => {
        cache = {};
      });
    },
  };

  await storageDump({
    key: '@test1',
    model: persistModel,
    engine: customEngine,
  });

  store.unmount();
  store.init({
    persist: [
      {
        version: 1,
        keyPrefix: '@',
        key: 'test1',
        engine: customEngine,
        models: [persistModel],
      },
    ],
  });

  const persistManager = store['persister']!;

  const promise = persistManager.init(store, true);
  persistModel.plus(6);
  expect(persistModel.state.counter).toBe(6);
  await promise;

  expect(persistModel.state.counter).toBe(0);
  await expect(customEngine.getItem('@test1')).resolves.toContain(
    stringifyTwice(persistModel),
  );

  await sleep(100);

  expect(persistModel.state.counter).toBe(0);
  await expect(customEngine.getItem('@test1')).resolves.toContain(
    stringifyTwice(persistModel),
  );
  expect(persistManager.collect()).toMatchObject({
    [persistModel.name]: persistModel.state,
  });

  store.unmount();
});

test('default merge mode is `merge`', async () => {
  const persist = createDefaultInstance();

  await storageDump({
    key: persist.key,
    model: persistModel,
    state: { hello: 'world' },
  });

  await persist.init();

  expect(persist.collect()).toStrictEqual({
    [persistModel.name]: {
      hello: 'world',
      counter: 0,
    },
  });
});

test('set merge mode to `replace`', async () => {
  const persist = new PersistItem({
    version: 1,
    key: 'test-' + Math.random(),
    engine: engines.memoryStorage,
    models: [persistModel],
    merge: 'replace',
  });

  await storageDump({
    key: persist.key,
    model: persistModel,
    state: { hello: 'world' },
  });

  await persist.init();

  expect(persist.collect()).toStrictEqual({
    [persistModel.name]: {
      hello: 'world',
    },
  });
});

test('set merge mode to `deep-merge`', async () => {
  const model = defineModel('deep-merge-persist-model', {
    initialState: { hi: 'here', data: { name: 'test', age: 20 } },
  });

  const persist = new PersistItem({
    version: 1,
    key: 'test-' + Math.random(),
    engine: engines.memoryStorage,
    models: [model],
    merge: 'deep-merge',
  });

  await storageDump({
    key: persist.key,
    model: model,
    state: { hello: 'world', data: { name: 'g' } },
  });
  await persist.init();
  expect(persist.collect()).toStrictEqual({
    [model.name]: {
      hello: 'world',
      hi: 'here',
      data: { name: 'g', age: 20 },
    },
  });

  await storageDump({
    key: persist.key,
    model: model,
    state: { hello: 'world', data: 'x' },
  });
  await persist.init();
  expect(persist.collect()).toStrictEqual({
    [model.name]: {
      hello: 'world',
      hi: 'here',
      data: 'x',
    },
  });
});

test('through dump and load function without storage data', async () => {
  const spy1 = vitest.fn();
  const spy2 = vitest.fn();
  const model = defineModel('persist-model-' + Math.random(), {
    initialState: {},
    persist: {
      dump: spy1,
      load: spy2,
    },
  });

  store.unmount();
  store.init({
    persist: [
      {
        engine: engines.memoryStorage,
        key: 'test-initial-state-dump-and-load',
        version: 1,
        models: [model],
      },
    ],
  });
  expect(spy1).toBeCalledTimes(0);
  expect(spy2).toBeCalledTimes(0);
  await store.onInitialized();
  expect(spy1).toBeCalledTimes(1);
  expect(spy2).toBeCalledTimes(1);
  spy1.mockRestore();
  spy2.mockRestore();
});

test('context of load function contains initialState', async () => {
  const model = defineModel('persist-model-' + Math.random(), {
    initialState: { hello: 'world', count: 10 },
    persist: {
      dump(state) {
        return state.hello;
      },
      // @ts-expect-error
      load(hello) {
        return { hello: hello + 'x', test: this.initialState };
      },
    },
  });

  store.unmount();
  store.init({
    persist: [
      {
        engine: engines.memoryStorage,
        key: 'test-initialState-context',
        version: 1,
        models: [model],
      },
    ],
  });
  await store.onInitialized();
  expect(model.state).toStrictEqual({
    hello: 'worldx',
    count: 10,
    test: {
      hello: 'world',
      count: 10,
    },
  });
});

describe('merge method', () => {
  const persistItem = new PersistItem({
    key: '',
    version: '',
    engine: engines.memoryStorage,
    models: [],
  });

  test.each(['replace', 'merge', 'deep-merge'] satisfies PersistMergeMode[])(
    'array type',
    (mode) => {
      test('object + array', () => {
        expect(
          persistItem.merge({ hello: 'world' }, [{ foo: 'bar' }, {}], mode),
        ).toStrictEqual([{ foo: 'bar' }, {}]);
      });
      test('array + array', () => {
        expect(
          persistItem.merge([{ tick: 'tock' }], [{ foo: 'bar' }, {}], mode),
        ).toStrictEqual([{ tick: 'tock' }]);
      });
      test('array + object', () => {
        expect(
          persistItem.merge([{ tick: 'tock' }], { hello: 'world' }, mode),
        ).toStrictEqual({
          hello: 'world',
        });
      });
    },
  );

  test('replace', () => {
    expect(
      persistItem.merge({ hi: 'there' }, { hello: 'world' }, 'replace'),
    ).toStrictEqual({ hi: 'there' });
  });

  test('merge', () => {
    expect(
      persistItem.merge(
        { hello: 'world', hi: 'there', a: { c: '2' } },
        { hi: 'here', a: { b: '1' } },
        'merge',
      ),
    ).toStrictEqual({ hi: 'there', hello: 'world', a: { c: '2' } });
  });

  test('deep-merge', () => {
    expect(
      persistItem.merge(
        { hello: 'world', hi: 'there', a: { c: '2' } },
        { hi: 'here', a: { b: '1' } },
        'deep-merge',
      ),
    ).toStrictEqual({ hello: 'world', hi: 'there', a: { b: '1', c: '2' } });

    expect(
      persistItem.merge(
        { hello: 'world', hi: 'there', a: { c: '2' } },
        { hi: 'here', a: 'x' },
        'deep-merge',
      ),
    ).toStrictEqual({ hi: 'there', hello: 'world', a: { c: '2' } });

    expect(
      persistItem.merge(
        { hello: 'world', hi: 'there', a: { c: '2' } },
        { hi: 'here', a: ['x'] },
        'deep-merge',
      ),
    ).toStrictEqual({ hi: 'there', hello: 'world', a: { c: '2' } });
  });
});
