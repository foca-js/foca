import { defineModel, store } from '../src';
import { lazyLoad } from '../src/model/lazyLoad';
import { ModelStore } from '../src/store/modelStore';
import { basicModel } from './models/basicModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('reducer is not in store by default', () => {
  expect(store.getState()).not.toHaveProperty(basicModel.name);
});

test('reducer is in store by access state', () => {
  basicModel.state;
  expect(store.getState()).toHaveProperty(basicModel.name);
});

test('reducer is in store by calling reducers', () => {
  basicModel.plus(1);
  expect(store.getState()).toHaveProperty(basicModel.name);
});

test('reducer is in store by manual calling lazyLoad', () => {
  lazyLoad(basicModel.name);
  expect(store.getState()).toHaveProperty(basicModel.name);
});

test('events are called once reducer is loaded', async () => {
  const initFn = jest.fn();
  const changeFn = jest.fn();
  const unmountFn = jest.fn();

  const model = defineModel('event' + Math.random(), {
    initialState: {
      count: 0,
    },
    reducers: {
      change(state) {
        state.count++;
      },
    },
    events: {
      onInit: initFn,
      onChange: changeFn,
      onDestroy: unmountFn,
    },
  });

  await store.onInitialized();

  expect(initFn).toBeCalledTimes(0);
  expect(changeFn).toBeCalledTimes(0);
  expect(unmountFn).toBeCalledTimes(0);

  model.state;
  expect(initFn).toBeCalledTimes(1);
  expect(changeFn).toBeCalledTimes(0);
  expect(unmountFn).toBeCalledTimes(0);

  model.change();
  expect(initFn).toBeCalledTimes(1);
  expect(changeFn).toBeCalledTimes(1);
  expect(unmountFn).toBeCalledTimes(0);

  model.change();
  expect(initFn).toBeCalledTimes(1);
  expect(changeFn).toBeCalledTimes(2);
  expect(unmountFn).toBeCalledTimes(0);

  ModelStore.removeReducer.call(store, model.name);
  expect(initFn).toBeCalledTimes(1);
  expect(changeFn).toBeCalledTimes(2);
  expect(unmountFn).toBeCalledTimes(1);
});

test('never load reducer again since it had been destroyed', () => {
  lazyLoad(basicModel.name);
  expect(store.getState()).toHaveProperty(basicModel.name);

  ModelStore.removeReducer.call(store, basicModel.name);
  lazyLoad(basicModel.name);
  expect(store.getState()).not.toHaveProperty(basicModel.name);
});
