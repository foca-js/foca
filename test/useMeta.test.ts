import { act, renderHook } from '@testing-library/react-hooks';
import { FocaProvider, store, useMeta } from '../src';
import { basicModel } from './models/basic-model';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('get meta from effect method', async () => {
  const { result } = renderHook(() => useMeta(basicModel.hasError), {
    wrapper: FocaProvider,
  });

  expect(result.current).toStrictEqual({});

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.hasError();
  });

  expect(result.current).toStrictEqual({
    loading: true,
  });

  await act(async () => {
    await expect(promise).rejects.toThrowError();
  });

  expect(result.current).toStrictEqual({
    loading: false,
    message: 'my-test',
  });
});

test.skip('type checking', () => {
  const meta = useMeta(basicModel.bar);
  meta.message?.trim();
  meta.loading?.valueOf();
  // @ts-expect-error
  meta.message?.toFixed();

  // @ts-expect-error
  useMeta(basicModel.plus);
});
