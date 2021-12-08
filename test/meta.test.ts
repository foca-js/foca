import { getLoading, getMeta, store } from '../src';
import { MetaStateItem, META_DEFAULT_CATEGORY } from '../src/actions/meta';
import { EffectError } from '../src/exceptions/EffectError';
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
  metaStore.getState()[metaStore.helper.keyOf(basicModel.name, effectName)]
    ?.metas.data?.[category];

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
  expect(getLoading(basicModel.bos, 'pick', 'x')).toBeFalsy();
  expect(getLoading(basicModel.bos, 'pick').pick('x')).toBeFalsy();

  const promise = basicModel.bos.meta('x').execute();
  expect(getLoading(basicModel.bos, 'pick', 'x')).toBeTruthy();
  expect(getLoading(basicModel.bos, 'pick').pick('x')).toBeTruthy();
  expect(getLoading(basicModel.bos, 'pick', 'y')).toBeFalsy();
  expect(getLoading(basicModel.bos, 'pick').pick('y')).toBeFalsy();
  expect(getLoading(basicModel.bos)).toBeFalsy();

  await promise;
  expect(getLoading(basicModel.bos, 'pick', 'x')).toBeFalsy();
  expect(getLoading(basicModel.bos, 'pick').pick('x')).toBeFalsy();
});

test('Trace metas', async () => {
  expect(getMeta(basicModel.hasError, 'pick', 'a').message).toBeUndefined();
  expect(getMeta(basicModel.hasError, 'pick', 'b').message).toBeUndefined();

  const promise1 = basicModel.hasError.meta('a').execute('msg-test1');
  const promise2 = basicModel.hasError.meta('b').execute('msg-test2');
  expect(getMeta(basicModel.hasError, 'pick', 'a').message).toBeUndefined();
  expect(getMeta(basicModel.hasError, 'pick', 'b').message).toBeUndefined();

  await expect(promise1).rejects.toThrowError('msg-test1');
  await expect(promise2).rejects.toThrowError('msg-test2');

  expect(getMeta(basicModel.hasError, 'pick', 'a').message).toEqual(
    'msg-test1',
  );
  expect(getMeta(basicModel.hasError, 'pick', 'b').message).toEqual(
    'msg-test2',
  );
  expect(getMeta(basicModel.hasError, 'pick').pick('a').message).toEqual(
    'msg-test1',
  );
  expect(getMeta(basicModel.hasError, 'pick').pick('b').message).toEqual(
    'msg-test2',
  );

  expect(getMeta(basicModel.hasError).message).toBeUndefined();
});

test('The meta with undeclared category should always be same', () => {
  expect(getMeta(basicModel.foo)).toBe(getMeta(basicModel.foo));
  expect(Object.isFrozen(getMeta(basicModel.foo))).toBeTruthy();
});

test('metas and loadings are frozen', async () => {
  const combineKey = metaStore.helper.keyOf(basicModel.name, 'pureAsync');
  metaStore.helper.activate(combineKey);

  const promise = basicModel.pureAsync();
  expect(Object.isFrozen(getMeta(basicModel.pureAsync))).toBeTruthy();
  expect(Object.isFrozen(getMeta(basicModel.pureAsync, 'pick'))).toBeTruthy();
  expect(
    Object.isFrozen(getLoading(basicModel.pureAsync, 'pick')),
  ).toBeTruthy();

  await promise;
  expect(Object.isFrozen(getMeta(basicModel.pureAsync))).toBeTruthy();
  expect(Object.isFrozen(getMeta(basicModel.pureAsync, 'pick'))).toBeTruthy();
  expect(
    Object.isFrozen(getLoading(basicModel.pureAsync, 'pick')),
  ).toBeTruthy();
});
