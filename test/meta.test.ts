import { getLoading, getMeta, store } from '../src';
import { MetaStateItem, META_DEFAULT_CATEGORY } from '../src/actions/meta';
import { EffectError } from '../src/exceptions/EffectError';
import { metaStore } from '../src/store/metaStore';
import { basicModel } from './models/basicModel';
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

  getMeta(basicModel.foo.assign).find('xx');
  getMeta(basicModel.foo.assign, 'xx').message?.trim();
  // @ts-expect-error
  getMeta(basicModel.foo.assign, basicModel.foo);
  // @ts-expect-error
  getMeta(basicModel.foo.assign, true);
  // @ts-expect-error
  getMeta(basicModel.foo.assign, false);
  // @ts-expect-error
  getMeta(basicModel.normalMethod.assign);

  getLoading(basicModel.foo.assign).find('xx');
  getLoading(basicModel.foo.assign, 'xx').valueOf();
  // @ts-expect-error
  getLoading(basicModel.foo.assign, basicModel.foo);
  // @ts-expect-error
  getLoading(basicModel.foo.assign, true);
  // @ts-expect-error
  getLoading(basicModel.foo.assign, false);
  // @ts-expect-error
  getLoading(basicModel.normalMethod.assign);
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
  expect(getLoading(basicModel.bos.assign, 'x')).toBeFalsy();
  expect(getLoading(basicModel.bos.assign).find('x')).toBeFalsy();

  const promise = basicModel.bos.assign('x').execute();
  expect(getLoading(basicModel.bos.assign, 'x')).toBeTruthy();
  expect(getLoading(basicModel.bos.assign).find('x')).toBeTruthy();
  expect(getLoading(basicModel.bos.assign, 'y')).toBeFalsy();
  expect(getLoading(basicModel.bos.assign).find('y')).toBeFalsy();
  expect(getLoading(basicModel.bos)).toBeFalsy();

  await promise;
  expect(getLoading(basicModel.bos.assign, 'x')).toBeFalsy();
  expect(getLoading(basicModel.bos.assign).find('x')).toBeFalsy();
});

test('Trace metas', async () => {
  expect(getMeta(basicModel.hasError.assign, 'a').message).toBeUndefined();
  expect(getMeta(basicModel.hasError.assign, 'b').message).toBeUndefined();

  const promise1 = basicModel.hasError.assign('a').execute('msg-test1');
  const promise2 = basicModel.hasError.assign('b').execute('msg-test2');
  expect(getMeta(basicModel.hasError.assign, 'a').message).toBeUndefined();
  expect(getMeta(basicModel.hasError.assign, 'b').message).toBeUndefined();

  await expect(promise1).rejects.toThrowError('msg-test1');
  await expect(promise2).rejects.toThrowError('msg-test2');

  expect(getMeta(basicModel.hasError.assign, 'a').message).toEqual('msg-test1');
  expect(getMeta(basicModel.hasError.assign, 'b').message).toEqual('msg-test2');
  expect(getMeta(basicModel.hasError.assign).find('a').message).toEqual(
    'msg-test1',
  );
  expect(getMeta(basicModel.hasError.assign).find('b').message).toEqual(
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
  expect(Object.isFrozen(getMeta(basicModel.pureAsync.assign))).toBeTruthy();
  expect(Object.isFrozen(getLoading(basicModel.pureAsync.assign))).toBeTruthy();

  await promise;
  expect(Object.isFrozen(getMeta(basicModel.pureAsync))).toBeTruthy();
  expect(Object.isFrozen(getMeta(basicModel.pureAsync.assign))).toBeTruthy();
  expect(Object.isFrozen(getLoading(basicModel.pureAsync.assign))).toBeTruthy();
});
