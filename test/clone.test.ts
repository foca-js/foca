import { defineModel, cloneModel, store } from '../src';
import type { InternalModel } from '../src/model/types';
import { basicModel } from './models/basicModel';

let modelIndex = 0;

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('Model can be cloned', async () => {
  const model = cloneModel('model' + ++modelIndex, basicModel);

  expect(model.state.hello).toBe('world');
  expect(model.state.count).toBe(0);

  model.plus(11);
  expect(model.state.count).toBe(11);

  await expect(model.foo('earth', 5)).resolves.toBe('OK');
  expect(model.state.hello).toBe('earth');
  expect(model.state.count).toBe(16);
});

test('Cloned model name', () => {
  const model = cloneModel('model' + ++modelIndex, basicModel);
  expect(model.name).toBe('model' + modelIndex);
});

test('Clone model with same name is invalid', () => {
  const model = defineModel(Date.now().toString(), { initialState: {} });
  expect(() => cloneModel(model.name, model)).toThrowError();
});

test('Override state', () => {
  const model = cloneModel('model' + ++modelIndex, basicModel, {
    initialState: {
      count: 20,
      hello: 'cat',
    },
  }) as unknown as InternalModel;

  expect(model._$opts.initialState).toStrictEqual({
    count: 20,
    hello: 'cat',
  });
});

test('Override persist', () => {
  const model1 = defineModel('model' + ++modelIndex, {
    initialState: {},
    persist: {
      maxAge: 20,
      decode: (state) => state,
    },
    methods: {
      cc() {
        return 3;
      },
    },
  });

  const model2 = cloneModel('model' + ++modelIndex, model1, {
    persist: {},
  }) as unknown as InternalModel;

  expect(model2._$opts.persist).not.toHaveProperty('maxAge');

  const model3 = cloneModel('model' + ++modelIndex, model1, (prev) => {
    return {
      persist: {
        ...prev.persist,
        maxAge: 30,
      },
    };
  }) as unknown as InternalModel;

  expect(model3._$opts.persist).toHaveProperty('maxAge');
  expect(model3._$opts.persist).toHaveProperty('decode');
});

test('override methods or unknown option can cause error', () => {
  const model = defineModel('model' + ++modelIndex, { initialState: {} });

  expect(() =>
    cloneModel('a', model, {
      // @ts-expect-error
      reducers: {},
    }),
  ).toThrowError();

  expect(() =>
    cloneModel('b', model, {
      // @ts-expect-error
      methods: {},
    }),
  ).toThrowError();

  expect(() =>
    cloneModel('c', model, {
      // @ts-expect-error
      computed: {},
    }),
  ).toThrowError();

  expect(() =>
    cloneModel('d', model, {
      // @ts-expect-error
      whateverblabla: {},
    }),
  ).toThrowError();
});
