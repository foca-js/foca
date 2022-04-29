import { cloneModel, defineModel, engines, store } from '../src';
import { PersistSchema } from '../src/persist/PersistItem';

describe('onInit', () => {
  afterEach(() => {
    store.unmount();
  });

  const createModel = () => {
    return defineModel('events' + Math.random(), {
      initialState: { count: 0 },
      effects: {
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
    const clonedModel = cloneModel('events' + Math.random(), hookModel);

    expect(hookModel.state.count).toBe(0);
    expect(hook2Model.state.count).toBe(0);
    expect(clonedModel.state.count).toBe(0);

    await store.onInitialized();

    expect(hookModel.state.count).toBe(101 + 20);
    expect(hook2Model.state.count).toBe(101);
    expect(clonedModel.state.count).toBe(101);
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
      actions: {
        plus(state) {
          state.count += 1;
        },
        minus(state) {
          state.count -= 1;
        },
      },
      effects: {
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
          // type checking
          this.plus;
          this._invokeByReadyHook;
          this.state;
          // @ts-expect-error
          this.initialState;
          // @ts-expect-error
          this.onInit;

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
