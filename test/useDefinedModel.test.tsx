import { act } from '@testing-library/react';
import sleep from 'sleep-promise';
import {
  cloneModel,
  defineModel,
  FocaProvider,
  store,
  useLoading,
  useDefinedModel,
  useModel,
} from '../src';
import { loadingStore } from '../src/store/loadingStore';
import { renderHook } from './helpers/renderHook';
import { basicModel } from './models/basicModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('can register to modelStore and remove from modelStore', async () => {
  const { result, unmount } = renderHook(() => useDefinedModel(basicModel), {
    wrapper: FocaProvider,
  });

  expect(result.current).not.toBe(basicModel);
  expect(store.getState()).toHaveProperty(
    result.current.name,
    result.current.state,
  );

  unmount();
  await sleep(1);
  expect(store.getState()).not.toHaveProperty(result.current.name);
});

test('can register to loadingStore and remove from loadingStore', async () => {
  const { result, unmount } = renderHook(
    () => {
      const model = useDefinedModel(basicModel);
      useLoading(basicModel.pureAsync);
      useLoading(model.pureAsync);

      return model;
    },
    {
      wrapper: FocaProvider,
    },
  );

  const key1 = loadingStore.helper.keyOf(result.current.name, 'pureAsync');
  const key2 = loadingStore.helper.keyOf(basicModel.name, 'pureAsync');
  expect(loadingStore.getState()).not.toHaveProperty(key1);

  await act(async () => {
    const promise1 = result.current.pureAsync();
    const promise2 = basicModel.pureAsync();

    expect(loadingStore.getState()).toHaveProperty(key1);
    expect(loadingStore.getState()).toHaveProperty(key2);

    await promise1;
    await promise2;
  });

  expect(loadingStore.getState()).toHaveProperty(key1);
  expect(loadingStore.getState()).toHaveProperty(key2);

  unmount();
  await sleep(1);
  expect(loadingStore.getState()).not.toHaveProperty(key1);
  expect(loadingStore.getState()).toHaveProperty(key2);
});

test('call onDestroy event when local model is destroyed', async () => {
  const spy = jest.fn();
  const globalModel = defineModel('local-demo-1', {
    initialState: {},
    events: {
      onDestroy: spy,
    },
  });

  const { unmount } = renderHook(() => useDefinedModel(globalModel), {
    wrapper: FocaProvider,
  });

  expect(spy).toBeCalledTimes(0);
  unmount();
  await sleep(1);
  expect(spy).toBeCalledTimes(1);
  basicModel.plus(1);
  expect(spy).toBeCalledTimes(1);
});

test.skip('Type checking', () => {
  const hookModel = useDefinedModel(basicModel);

  useModel(hookModel);
  useModel(hookModel, (state) => state.count);
  useLoading(hookModel.pureAsync);
  useLoading(hookModel.pureAsync.room);

  // @ts-expect-error
  useModel(basicModel, hookModel);
  // @ts-expect-error
  useModel(hookModel, basicModel);
  // @ts-expect-error
  useModel(hookModel, basicModel, () => {});

  // @ts-expect-error
  useDefinedModel(hookModel);
  // @ts-expect-error
  cloneModel(hookModel);

  defineModel('local-demo-1', {
    initialState: {},
    events: {
      onDestroy() {
        // @ts-expect-error
        this.anything;
      },
    },
  });
});
