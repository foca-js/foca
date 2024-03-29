import sleep from 'sleep-promise';
import { cloneModel, defineModel, memoryStorage, store } from '../src';
import { PersistSchema } from '../src/persist/persist-item';

describe('onInit', () => {
  afterEach(() => {
    store.unmount();
  });

  const createModel = () => {
    return defineModel('events' + Math.random(), {
      initialState: { count: 0 },
      methods: {
        invokeByReadyHook() {
          this.setState((state) => {
            state.count += 101;
          });
        },
      },
      events: {
        onInit() {
          this.invokeByReadyHook();
        },
      },
    });
  };

  test('trigger ready events on store ready', async () => {
    const hookModel = createModel();
    store.init();

    const hook2Model = createModel();
    const clonedModel = cloneModel('events' + Math.random(), hookModel);

    await Promise.resolve();

    expect(hookModel.state.count).toBe(101);
    expect(hook2Model.state.count).toBe(101);
    expect(clonedModel.state.count).toBe(101);
  });

  test('trigger ready events on store and persist ready', async () => {
    const hookModel = createModel();

    await memoryStorage.setItem(
      'mm:z',
      JSON.stringify(<PersistSchema>{
        v: 1,
        d: {
          [hookModel.name]: {
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
          engine: memoryStorage,
          models: [hookModel],
        },
      ],
    });

    const hook2Model = createModel();
    const clonedModel = cloneModel('events' + Math.random(), hookModel);

    expect(hookModel.state.count).toBe(0);
    expect(hook2Model.state.count).toBe(0);
    expect(clonedModel.state.count).toBe(0);

    await store.onInitialized();

    expect(hookModel.state.count).toBe(101 + 20);
    expect(hook2Model.state.count).toBe(101);
    expect(clonedModel.state.count).toBe(101);
  });

  test('should call modelPreInit and modelPostInit', async () => {
    const hookModel = createModel();
    let publishCount = 0;
    const token1 = store.topic.subscribe('modelPreInit', (modelName) => {
      if (modelName === hookModel.name) {
        publishCount += 1;
      }
    });
    const token2 = store.topic.subscribe('modelPostInit', (modelName) => {
      if (modelName === hookModel.name) {
        publishCount += 0.4;
      }
    });

    store.init();
    await store.onInitialized();
    expect(publishCount).toBe(1 + 0.4);
    token1.unsubscribe();
    token2.unsubscribe();
  });

  test('should call modelPreInit and modelPostInit for promise returning', async () => {
    const hookModel = defineModel('events' + Math.random(), {
      initialState: {},
      events: {
        async onInit() {
          await sleep(200);
        },
      },
    });
    let publishCount = 0;
    const token1 = store.topic.subscribe('modelPreInit', (modelName) => {
      if (modelName === hookModel.name) {
        publishCount += 1;
      }
    });
    const token2 = store.topic.subscribe('modelPostInit', (modelName) => {
      if (modelName === hookModel.name) {
        publishCount += 0.4;
      }
    });

    store.init();
    await store.onInitialized();
    expect(publishCount).toBe(1);
    await sleep(210);
    expect(publishCount).toBe(1 + 0.4);
    token1.unsubscribe();
    token2.unsubscribe();
  });
});

describe('onChange', () => {
  beforeEach(() => {
    store.init();
  });

  afterEach(() => {
    store.unmount();
  });

  test('onChange should call after onInit', async () => {
    let testMessage = '';
    const model = defineModel('events' + Math.random(), {
      initialState: { count: 0 },
      reducers: {
        plus(state) {
          state.count += 1;
        },
        minus(state) {
          state.count -= 1;
        },
      },
      methods: {
        _invokeByReadyHook() {
          this.setState((state) => {
            state.count += 2;
          });
        },
      },
      events: {
        onInit() {
          testMessage += 'onInit-';
          this._invokeByReadyHook();
        },
        onChange(prevState, nextState) {
          testMessage += `prev-${prevState.count}-next-${nextState.count}-`;
        },
      },
    });
    model.plus();
    model.minus();
    expect(testMessage).toBe('');

    await store.onInitialized();

    expect(testMessage).toBe('onInit-prev-0-next-2-');
    model.plus();
    expect(testMessage).toBe('onInit-prev-0-next-2-prev-2-next-3-');
    store.refresh();
    expect(testMessage).toBe(
      'onInit-prev-0-next-2-prev-2-next-3-prev-3-next-0-',
    );
  });
});

describe('onDestroy', () => {
  beforeEach(() => {
    store.init();
  });

  afterEach(() => {
    store.unmount();
  });

  test('call onDestroy when invoke store.destroy()', async () => {
    const spy = vitest.fn();
    const model = defineModel('events' + Math.random(), {
      initialState: { count: 0 },
      reducers: {
        update(state) {
          state.count += 1;
        },
      },
      events: {
        onDestroy: spy,
      },
    });

    await store.onInitialized();

    model.update();
    expect(spy).toBeCalledTimes(0);
    store['removeReducer'](model.name);
    expect(spy).toBeCalledTimes(1);
    spy.mockRestore();
  });

  test('should not call onChange', async () => {
    const destroySpy = vitest.fn();
    const changeSpy = vitest.fn();
    const model = defineModel('events' + Math.random(), {
      initialState: { count: 0 },
      reducers: {
        update(state) {
          state.count += 1;
        },
      },
      events: {
        onChange: changeSpy,
        onDestroy: destroySpy,
      },
    });

    await store.onInitialized();

    model.update();
    expect(destroySpy).toBeCalledTimes(0);
    expect(changeSpy).toBeCalledTimes(1);
    store['removeReducer'](model.name);
    expect(destroySpy).toBeCalledTimes(1);
    expect(changeSpy).toBeCalledTimes(1);
    destroySpy.mockRestore();
  });
});
