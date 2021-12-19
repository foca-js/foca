import { act, renderHook } from '@testing-library/react-hooks';
import { FocaProvider, store, useLoading } from '../src';
import { basicModel } from './models/basicModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.refresh();
  store.unmount();
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
    () => useLoading(basicModel.pureAsync.assign, 'x'),
    {
      wrapper: FocaProvider,
    },
  );

  expect(result.current).toBeFalsy();

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync.assign('x').execute();
  });

  expect(result.current).toBeTruthy();

  await act(async () => {
    await promise;
  });

  expect(result.current).toBeFalsy();
});

test('Pick loading from loadings', async () => {
  const { result } = renderHook(() => useLoading(basicModel.pureAsync.assign), {
    wrapper: FocaProvider,
  });

  expect(result.current.find('m')).toBeFalsy();
  expect(result.current.find('n')).toBeFalsy();

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync.assign('m').execute();
  });

  expect(result.current.find('m')).toBeTruthy();
  expect(result.current.find('n')).toBeFalsy();

  await act(async () => {
    await promise;
  });

  expect(result.current.find('m')).toBeFalsy();
  expect(result.current.find('n')).toBeFalsy();
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

  useLoading(basicModel.foo.assign).find('xx');
  useLoading(basicModel.foo.assign, 'xx').valueOf();
  // @ts-expect-error
  useLoading(basicModel.foo.assign, basicModel.foo);
  // @ts-expect-error
  useLoading(basicModel.foo.assign, true);
  // @ts-expect-error
  useLoading(basicModel.foo.assign, false);
  // @ts-expect-error
  useLoading(basicModel.normalMethod.assign);
  // @ts-expect-error
  useLoading(basicModel.minus.assign);
});
