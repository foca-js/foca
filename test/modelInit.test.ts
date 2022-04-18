import { cloneModel, defineModel, engines, store } from '../src';
import { PersistSchema } from '../src/persist/PersistItem';

afterEach(() => {
  store.unmount();
});

const createModel = () => {
  return defineModel('hooks' + Math.random(), {
    initialState: { count: 0 },
    effects: {
      invokeByReadyHook() {
        this.setState((state) => {
          state.count += 101;
        });
      },
    },
    hooks: {
      onInit() {
        this.invokeByReadyHook();
      },
    },
  });
};

test('trigger ready hooks on store ready', async () => {
  const hookModel = createModel();
  store.init();

  const hook2Model = createModel();
  const clonedModel = cloneModel('hooks' + Math.random(), hookModel);

  await Promise.resolve();

  expect(hookModel.state.count).toBe(101);
  expect(hook2Model.state.count).toBe(101);
  expect(clonedModel.state.count).toBe(101);
});

test('trigger ready hooks on store and persist ready', async () => {
  const hookModel = createModel();

  await engines.memoryStorage.setItem(
    'mm:z',
    JSON.stringify(<PersistSchema>{
      v: 1,
      d: {
        [hookModel.name]: {
          t: Date.now(),
          v: 0,
          d: JSON.stringify({ count: 20 }),
        },
      },
    }),
  );

  store.init({
    persist: [
      {
        key: 'z',
        keyPrefix: 'mm:',
        version: 1,
        engine: engines.memoryStorage,
        models: [hookModel],
      },
    ],
  });

  const hook2Model = createModel();
  const clonedModel = cloneModel('hooks' + Math.random(), hookModel);

  expect(hookModel.state.count).toBe(0);
  expect(hook2Model.state.count).toBe(0);
  expect(clonedModel.state.count).toBe(0);

  await store.onInitialized();

  expect(hookModel.state.count).toBe(101 + 20);
  expect(hook2Model.state.count).toBe(101);
  expect(clonedModel.state.count).toBe(101);
});

test('initialState should be serializable', () => {
  const createModel = (initialState: any) => {
    return defineModel('model' + Math.random(), { initialState });
  };

  [
    { x: undefined },
    { x: undefined, y: null },
    { x: Symbol('test') },
    [Symbol('test')],
    { x: function () {} },
    { x: /test/ },
    { x: new Map() },
    { x: new Set() },
    { x: new Date() },
    [new (class {})()],
    new (class {})(),
  ].forEach((initialState) => {
    expect(() => createModel(initialState)).toThrowError();
  });

  [
    { x: 0 },
    [0, 1, '2', {}, { x: null }],
    { x: { y: { z: [{}, {}] } } },
  ].forEach((initialState) => {
    createModel(initialState);
  });
});
