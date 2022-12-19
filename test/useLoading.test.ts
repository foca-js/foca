import { act } from '@testing-library/react';
import { renderHook } from './helpers/renderHook';
import { store, useLoading } from '../src';
import { basicModel } from './models/basicModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('Trace loading', async () => {
  const { result } = renderHook(() => useLoading(basicModel.pureAsync));

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
  const { result } = renderHook(() =>
    useLoading(basicModel.pureAsync, basicModel.foo, basicModel.bar),
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
  const { result } = renderHook(() =>
    useLoading(basicModel.pureAsync.room, 'x'),
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
  const { result } = renderHook(() => useLoading(basicModel.pureAsync.room));

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
