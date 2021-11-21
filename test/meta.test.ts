import { getLoading, getMeta, store } from '../src';
import { MetaStateItem, META_DEFAULT_ID } from '../src/actions/meta';
import { EffectError } from '../src/exceptions/EffectError';
import { metaManager } from '../src/reducers/MetaManger';
import { getMetaId } from '../src/utils/getMetaId';
import { basicModel } from './models/basic-model';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
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
  basicModel.normalMethod.loading;
  // @ts-expect-error
  basicModel.normalMethod.meta;
  // @ts-expect-error
  basicModel.normalMethod.meta?.loading;

  getLoading(basicModel.foo).valueOf();
  getMeta(basicModel.foo).message?.trim();
  getMeta(basicModel.foo).type?.valueOf();
});

const effectName = 'pureAsync';
const getMetaFromStore = (id: number | string): MetaStateItem | undefined =>
  store.getState()[metaManager.name]?.[basicModel.name]?.[effectName]?.[
    getMetaId(id)
  ];

test('meta from untracked to used', async () => {
  expect(getMetaFromStore(META_DEFAULT_ID)).toBeUndefined();
  metaManager.get(basicModel[effectName]);
  expect(getMetaFromStore(META_DEFAULT_ID)).toBeUndefined();

  const promise = basicModel[effectName]();
  expect(getMetaFromStore(META_DEFAULT_ID)).toMatchObject<MetaStateItem>({
    type: 'pending',
  });

  await promise;
  expect(getMetaFromStore(META_DEFAULT_ID)).toMatchObject<MetaStateItem>({
    type: 'resolved',
  });
});
