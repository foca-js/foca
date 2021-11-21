import { act, renderHook } from '@testing-library/react-hooks';
import { FocaProvider, store, useMetas } from '../src';
import { MetaStateItem } from '../src/actions/meta';
import { basicModel } from './models/basic-model';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('get meta from effect method', async () => {
  const { result: result1 } = renderHook(
    () => useMetas(basicModel.hasError, 'x'),
    {
      wrapper: FocaProvider,
    },
  );
  const { result: result2 } = renderHook(
    () => useMetas(basicModel.hasError, 'y'),
    {
      wrapper: FocaProvider,
    },
  );

  expect(result1.current).toStrictEqual<MetaStateItem>({});
  expect(result2.current).toStrictEqual<MetaStateItem>({});

  let promise1!: Promise<any>;
  let promise2!: Promise<any>;

  act(() => {
    promise1 = basicModel.hasError.metaId('x').execute('aaa');
    promise2 = basicModel.hasError.metaId('y').execute('bbb');
  });

  expect(result1.current).toStrictEqual<MetaStateItem>({
    type: 'pending',
  });
  expect(result2.current).toStrictEqual<MetaStateItem>({
    type: 'pending',
  });

  await act(async () => {
    await expect(promise1).rejects.toThrowError();
    await expect(promise2).rejects.toThrowError();
  });

  expect(result1.current).toStrictEqual<MetaStateItem>({
    type: 'rejected',
    message: 'aaa',
  });
  expect(result2.current).toStrictEqual<MetaStateItem>({
    type: 'rejected',
    message: 'bbb',
  });
});

test.skip('type checking', () => {
  useMetas(basicModel.bar, 'xyz').message?.trim();
  const meta = useMetas(basicModel.bar).pick('m');
  meta.message?.trim();
  meta.type?.valueOf();
  // @ts-expect-error
  meta.message?.toFixed();

  // @ts-expect-error
  useMetas(basicModel.plus);
});
