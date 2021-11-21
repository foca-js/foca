import { act, renderHook } from '@testing-library/react-hooks';
import { FocaProvider, store, useLoadings } from '../src';
import { basicModel } from './models/basic-model';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('Trace loading from effect method', async () => {
  const { result } = renderHook(() => useLoadings(basicModel.pureAsync, 'x'), {
    wrapper: FocaProvider,
  });

  expect(result.current).toBeFalsy();

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync.metaId('x').execute();
  });

  expect(result.current).toBeTruthy();

  await act(async () => {
    await promise;
  });

  expect(result.current).toBeFalsy();
});

test('Pick loading', async () => {
  const { result } = renderHook(() => useLoadings(basicModel.pureAsync), {
    wrapper: FocaProvider,
  });

  expect(result.current.pick('m')).toBeFalsy();
  expect(result.current.pick('n')).toBeFalsy();

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync.metaId('m').execute();
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
  useLoadings(basicModel.bar, 'x').valueOf();
  useLoadings(basicModel.foo).pick('m').valueOf();
  // @ts-expect-error
  useLoadings(basicModel.minus);
  // @ts-expect-error
  useLoadings(basicModel);
  // @ts-expect-error
  useLoadings({});
});
