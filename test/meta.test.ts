import { getLoading, getLoadings, getMeta, getMetas, store } from '../src';
import { MetaStateItem, META_DEFAULT_CATEGORY } from '../src/actions/meta';
import { EffectError } from '../src/exceptions/EffectError';
import { metaStore } from '../src/store/metaStore';
import { metaKey } from '../src/utils/metaKey';
import { basicModel } from './models/basic-model';
import { storeUnmount } from './utils/store';

beforeEach(() => {
  store.init();
  metaStore.helper.refresh();
});

afterEach(() => {
  storeUnmount();
});

test('Collect loading status for effect method', async () => {
  expect(getLoading(basicModel.bos)).toBeFalsy();
  const promise = basicModel.bos();
  expect(getLoading(basicModel.bos)).toBeTruthy();
  await promise;
  expect(getLoading(basicModel.bos)).toBeFalsy();
});

test('Collect error message for effect method', async () => {
  expect(getLoading(basicModel.hasError)).toBeFalsy();
  expect(getMeta(basicModel.hasError).message).toBeUndefined();

  const promise = basicModel.hasError();
  expect(getLoading(basicModel.hasError)).toBeTruthy();
  expect(getMeta(basicModel.hasError).message).toBeUndefined();

  await expect(promise).rejects.toThrowError('my-test');

  expect(getLoading(basicModel.hasError)).toBeFalsy();
  expect(getMeta(basicModel.hasError).message).toBe('my-test');
});

test('More info will be stored from EffectError', async () => {
  expect(getMeta(basicModel.hasEffectError)).not.toHaveProperty('hello');

  await expect(basicModel.hasEffectError()).rejects.toThrowError(EffectError);

  expect(getMeta(basicModel.hasEffectError).message).toBe('next-test');
  expect(getMeta(basicModel.hasEffectError)).toHaveProperty('hello', 'world');
});

test.skip('Meta is unsupported for non-async effect method', () => {
  // @ts-expect-error
  getMeta(basicModel.normalMethod);
  // @ts-expect-error
  getMeta(basicModel.normalMethod);

  getLoading(basicModel.foo).valueOf();
  getMeta(basicModel.foo).message?.trim();
  getMeta(basicModel.foo).type?.valueOf();
});

const effectName = 'pureAsync';
const getMetaFromStore = (
  category: number | string,
): MetaStateItem | undefined =>
  metaStore.getState()[basicModel.name]?.[effectName]?.[metaKey(category)];

test('meta from untracked to used', async () => {
  expect(getMetaFromStore(META_DEFAULT_CATEGORY)).toBeUndefined();
  metaStore.helper.get(basicModel[effectName]);
  expect(getMetaFromStore(META_DEFAULT_CATEGORY)).toBeUndefined();

  const promise = basicModel[effectName]();
  expect(getMetaFromStore(META_DEFAULT_CATEGORY)).toMatchObject<MetaStateItem>({
    type: 'pending',
  });

  await promise;
  expect(getMetaFromStore(META_DEFAULT_CATEGORY)).toMatchObject<MetaStateItem>({
    type: 'resolved',
  });
});

test('Trace loadings', async () => {
  expect(getLoadings(basicModel.bos, 'x')).toBeFalsy();
  expect(getLoadings(basicModel.bos).pick('x')).toBeFalsy();

  const promise = basicModel.bos.meta('x').execute();
  expect(getLoadings(basicModel.bos, 'x')).toBeTruthy();
  expect(getLoadings(basicModel.bos).pick('x')).toBeTruthy();
  expect(getLoadings(basicModel.bos, 'y')).toBeFalsy();
  expect(getLoadings(basicModel.bos).pick('y')).toBeFalsy();
  expect(getLoading(basicModel.bos)).toBeFalsy();

  await promise;
  expect(getLoadings(basicModel.bos, 'x')).toBeFalsy();
  expect(getLoadings(basicModel.bos).pick('x')).toBeFalsy();
});

test('Trace metas', async () => {
  expect(getMetas(basicModel.hasError, 'a').message).toBeUndefined();
  expect(getMetas(basicModel.hasError, 'b').message).toBeUndefined();

  const promise1 = basicModel.hasError.meta('a').execute('msg-test1');
  const promise2 = basicModel.hasError.meta('b').execute('msg-test2');
  expect(getMetas(basicModel.hasError, 'a').message).toBeUndefined();
  expect(getMetas(basicModel.hasError, 'b').message).toBeUndefined();

  await expect(promise1).rejects.toThrowError('msg-test1');
  await expect(promise2).rejects.toThrowError('msg-test2');

  expect(getMetas(basicModel.hasError, 'a').message).toEqual('msg-test1');
  expect(getMetas(basicModel.hasError, 'b').message).toEqual('msg-test2');
  expect(getMetas(basicModel.hasError).pick('a').message).toEqual('msg-test1');
  expect(getMetas(basicModel.hasError).pick('b').message).toEqual('msg-test2');

  expect(getMeta(basicModel.hasError).message).toBeUndefined();
});
