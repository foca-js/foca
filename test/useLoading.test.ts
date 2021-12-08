import { act, renderHook } from '@testing-library/react-hooks';
import { FocaProvider, store, useLoading } from '../src';
import { metaStore } from '../src/store/metaStore';
import { basicModel } from './models/basic-model';
import { storeUnmount } from './utils/store';

beforeEach(() => {
  store.init();
  metaStore.helper.refresh();
});

afterEach(() => {
  storeUnmount();
});

test('Trace loading', async () => {
  const { result } = renderHook(() => useLoading(basicModel.pureAsync), {
    wrapper: FocaProvider,
  });

  expect(result.current).toBeFalsy();

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync();
  });

  expect(result.current).toBeTruthy();

  await act(async () => {
    await promise;
  });

  expect(result.current).toBeFalsy();
});

test('Compose the loadings', async () => {
  const { result } = renderHook(
    () => useLoading(basicModel.pureAsync, basicModel.foo, basicModel.bar),
    {
      wrapper: FocaProvider,
    },
  );

  expect(result.current).toBeFalsy();

  let promise1!: Promise<any>;

  act(() => {
    promise1 = basicModel.pureAsync();
  });

  expect(result.current).toBeTruthy();

  let promise2!: Promise<any>;

  await act(async () => {
    await promise1;
    promise2 = basicModel.foo('', 2);
  });

  expect(result.current).toBeTruthy();

  await act(async () => {
    await promise2;
  });

  expect(result.current).toBeFalsy();
});

test('Trace loadings', async () => {
  const { result } = renderHook(
    () => useLoading(basicModel.pureAsync, 'pick', 'x'),
    {
      wrapper: FocaProvider,
    },
  );

  expect(result.current).toBeFalsy();

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync.meta('x').execute();
  });

  expect(result.current).toBeTruthy();

  await act(async () => {
    await promise;
  });

  expect(result.current).toBeFalsy();
});

test('Pick loading from loadings', async () => {
  const { result } = renderHook(
    () => useLoading(basicModel.pureAsync, 'pick'),
    {
      wrapper: FocaProvider,
    },
  );

  expect(result.current.pick('m')).toBeFalsy();
  expect(result.current.pick('n')).toBeFalsy();

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync.meta('m').execute();
  });

  expect(result.current.pick('m')).toBeTruthy();
  expect(result.current.pick('n')).toBeFalsy();

  await act(async () => {
    await promise;
  });

  expect(result.current.pick('m')).toBeFalsy();
  expect(result.current.pick('n')).toBeFalsy();
});

test.skip('type checking', () => {
  useLoading(basicModel.bar).valueOf();
  useLoading(basicModel.foo, basicModel.bar).valueOf();
  // @ts-expect-error
  useLoading(basicModel.minus);
  // @ts-expect-error
  useLoading(basicModel);
  // @ts-expect-error
  useLoading({});

  useLoading(basicModel.bar, 'pick', 'x').valueOf();
  useLoading(basicModel.foo, 'pick').pick('m').valueOf();
  // @ts-expect-error
  useLoading(basicModel.minus, 'pick');
});
