import { act } from '@testing-library/react';
import { expectType } from 'ts-expect';
import { renderHook } from './helpers/renderHook';
import { FocaProvider, store, useLoading } from '../src';
import { basicModel } from './models/basicModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
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
    () => useLoading(basicModel.pureAsync.room, 'x'),
    {
      wrapper: FocaProvider,
    },
  );

  expect(result.current).toBeFalsy();

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync.room('x').execute();
  });

  expect(result.current).toBeTruthy();

  await act(async () => {
    await promise;
  });

  expect(result.current).toBeFalsy();
});

test('Pick loading from loadings', async () => {
  const { result } = renderHook(() => useLoading(basicModel.pureAsync.room), {
    wrapper: FocaProvider,
  });

  expect(result.current.find('m')).toBeFalsy();
  expect(result.current.find('n')).toBeFalsy();

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync.room('m').execute();
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
  expectType<boolean>(useLoading(basicModel.bar));
  expectType<boolean>(useLoading(basicModel.foo, basicModel.bar));
  // @ts-expect-error
  useLoading(basicModel.minus);
  // @ts-expect-error
  useLoading(basicModel);
  // @ts-expect-error
  useLoading({});

  expectType<boolean>(useLoading(basicModel.foo.room).find('xx'));
  expectType<boolean>(useLoading(basicModel.foo.room, 'xx'));
  // @ts-expect-error
  useLoading(basicModel.foo.room, basicModel.foo);
  // @ts-expect-error
  useLoading(basicModel.foo.room, true);
  // @ts-expect-error
  useLoading(basicModel.foo.room, false);
  // @ts-expect-error
  useLoading(basicModel.normalMethod.room);
  // @ts-expect-error
  useLoading(basicModel.normalMethod.assign);
  // @ts-expect-error
  useLoading(basicModel.minus.room);
});
