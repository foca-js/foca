import sleep from 'sleep-promise';
import { engines, Model, store } from '../src';
import { PersistItem, PersistSchema } from '../src/persist/PersistItem';
import { basicModel } from './models/basicModel';
import {
  hasDecodePersistModel,
  hasVersionPersistModel,
  persistModel,
} from './models/persistModel';

const stringifyState = (model: Model) => {
  return JSON.stringify(JSON.stringify(model.state));
};

const createDefaultInstance = () => {
  return new PersistItem({
    version: 1,
    key: 'test1',
    engine: engines.memoryStorage,
    models: [persistModel],
  });
};

beforeEach(() => {
  store.init();
});

afterEach(async () => {
  store.unmount();
  await engines.memoryStorage.clear();
});

test('rehydrate state to storage', async () => {
  const persist = createDefaultInstance();

  await expect(engines.memoryStorage.getItem(persist.key)).resolves.toBeNull();

  await persist.init();

  await expect(engines.memoryStorage.getItem(persist.key)).resolves.toBe(
    JSON.stringify(persist),
  );
  expect(engines.memoryStorage.getItem(persist.key)).not.toContain(
    stringifyState(persistModel),
  );

  persistModel.plus(15);
  expect(persistModel.state.counter).toBe(15);

  persist.update({
    [persistModel.name]: persistModel.state,
  });

  await sleep(1);

  const value = await engines.memoryStorage.getItem(persist.key);
  expect(value).toBe(JSON.stringify(persist));
  expect(value).toContain(stringifyState(persistModel));
});

test('hydrate state from storage', async () => {
  const persist = createDefaultInstance();

  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [persistModel.name]: {
          t: Date.now(),
          v: 0,
          d: JSON.stringify({ counter: 15 }),
        },
      },
    }),
  );

  await persist.init();

  expect(persist.collect()).toMatchObject({
    [persistModel.name]: {
      counter: 15,
    },
  });
});

test('hydrate failed due to different persist version', async () => {
  const persist = createDefaultInstance();

  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 20,
      d: {
        [persistModel.name]: {
          t: Date.now(),
          v: 0,
          d: JSON.stringify(persistModel.state),
        },
      },
    }),
  );

  await persist.init();

  expect(JSON.stringify(persist.collect())).toBe('{}');
});

test('hydrate failed due to different model version', async () => {
  const persist = createDefaultInstance();

  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [persistModel.name]: {
          t: Date.now(),
          v: 17,
          d: JSON.stringify(persistModel.state),
        },
      },
    }),
  );

  await persist.init();

  expect(JSON.stringify(persist.collect())).toBe('{}');
});

test('hydrate failed due to expired', async () => {
  const persist = new PersistItem({
    version: 1,
    key: 'test1',
    engine: engines.memoryStorage,
    models: [persistModel],
    maxAge: 100,
  });

  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [persistModel.name]: {
          t: Date.now() - 101,
          v: 0,
          d: JSON.stringify(persistModel.state),
        },
      },
    }),
  );

  await persist.init();

  expect(JSON.stringify(persist.collect())).toBe('{}');
});

test('never rehydrate even time expired', async () => {
  const persist = new PersistItem({
    version: 1,
    key: 'test1',
    engine: engines.memoryStorage,
    models: [persistModel],
    maxAge: 100,
  });

  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [persistModel.name]: {
          t: Date.now(),
          v: 0,
          d: JSON.stringify(persistModel.state),
        },
      },
    }),
  );

  await persist.init();
  const currentValue = await engines.memoryStorage.getItem(persist.key);
  expect(currentValue).toContain(stringifyState(persistModel));

  await sleep(1);
  persist.update({
    [persistModel.name]: persistModel.state,
  });
  await sleep(1);
  await expect(engines.memoryStorage.getItem(persist.key)).resolves.toBe(
    currentValue,
  );

  await sleep(100);
  persist.update({
    [persistModel.name]: persistModel.state,
  });
  await sleep(1);
  await expect(engines.memoryStorage.getItem(persist.key)).resolves.toBe(
    currentValue,
  );
});

test('hydrate failed due to invalid format', async () => {
  let persist = createDefaultInstance();
  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [persistModel.name]: {
          t: Date.now(),
          v: 0,
          d: JSON.stringify(persistModel.state) + '$$$$',
        },
      },
    }),
  );
  await expect(persist.init()).rejects.toThrowError();
  expect(persist.collect()).toStrictEqual({});

  await Promise.resolve();
  persist = createDefaultInstance();
  await expect(persist.init()).resolves.toBeUndefined();
  expect(persist.collect()).toStrictEqual({});

  persist = createDefaultInstance();
  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [persistModel.name]: {
          t: Date.now(),
          v: 0,
          d: JSON.stringify(persistModel.state) + '$$$$',
        },
      },
    }) + '$$$$',
  );
  await expect(persist.init()).rejects.toThrowError();
  expect(persist.collect()).toStrictEqual({});

  await Promise.resolve();
  persist = createDefaultInstance();
  await expect(persist.init()).resolves.toBeUndefined();
  expect(persist.collect()).toStrictEqual({});
});

test('abandon unregisted model', async () => {
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
          d: JSON.stringify(persistModel.state),
        },
        [basicModel.name]: {
          t: Date.now(),
          v: 0,
          d: JSON.stringify(basicModel.state),
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
  expect(storageValue).toContain(stringifyState(basicModel));
  expect(storageValue).not.toContain(stringifyState(persistModel));
});

test('model can specific persist version', async () => {
  const persist = new PersistItem({
    version: 1,
    key: 'test1',
    engine: engines.memoryStorage,
    models: [persistModel, hasVersionPersistModel],
  });

  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [hasVersionPersistModel.name]: {
          t: Date.now(),
          v: 10,
          d: JSON.stringify(hasVersionPersistModel.state),
        },
      },
    }),
  );

  await persist.init();

  expect(persist.collect()).toMatchObject({
    [hasVersionPersistModel.name]: hasVersionPersistModel.state,
  });
});

test('model can specific persist decoder', async () => {
  const persist = new PersistItem({
    version: 1,
    key: 'test1',
    engine: engines.memoryStorage,
    models: [persistModel, hasDecodePersistModel],
  });

  await engines.memoryStorage.setItem(
    persist.key,
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [hasDecodePersistModel.name]: {
          t: Date.now(),
          v: 0,
          d: JSON.stringify(hasDecodePersistModel.state),
        },
      },
    }),
  );

  await persist.init();

  expect(persist.collect()).toMatchObject({
    [hasDecodePersistModel.name]: {
      counter: 57,
    },
  });
});
