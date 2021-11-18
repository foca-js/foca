import { store } from '../src';
import { MetaStateItem } from '../src/actions/meta';
import { EffectError } from '../src/exceptions/EffectError';
import { metaManager } from '../src/reducers/MetaManger';
import { basicModel } from './models/basic-model';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('Collect loading status for effect method', async () => {
  expect(basicModel.bos.loading).toBeFalsy();
  const promise = basicModel.bos();
  expect(basicModel.bos.loading).toBeTruthy();
  await promise;
  expect(basicModel.bos.loading).toBeFalsy();
});

test('Collect error message for effect method', async () => {
  expect(basicModel.hasError.loading).toBeFalsy();
  expect(basicModel.hasError.meta.message).toBeUndefined();

  const promise = basicModel.hasError();
  expect(basicModel.hasError.loading).toBeTruthy();
  expect(basicModel.hasError.meta.message).toBeUndefined();

  await expect(promise).rejects.toThrowError('my-test');

  expect(basicModel.hasError.loading).toBeFalsy();
  expect(basicModel.hasError.meta.message).toBe('my-test');
});

test('More info will be stored from EffectError', async () => {
  expect(basicModel.hasEffectError.meta).not.toHaveProperty('hello');

  await expect(basicModel.hasEffectError()).rejects.toThrowError(EffectError);

  expect(basicModel.hasEffectError.meta.message).toBe('next-test');
  expect(basicModel.hasEffectError.meta).toHaveProperty('hello', 'world');
});

test.skip('Meta is unsupported for non-async effect method', () => {
  // @ts-expect-error
  basicModel.normalMethod.loading;
  // @ts-expect-error
  basicModel.normalMethod.meta;
  // @ts-expect-error
  basicModel.normalMethod.meta?.loading;

  basicModel.foo.loading.valueOf();
  basicModel.foo.meta.message?.trim();
  basicModel.foo.meta.loading?.valueOf();
});

const effectName = 'pureAsync';
const getMeta = (): MetaStateItem | undefined =>
  store.getState()[metaManager.name]?.[basicModel.name]?.[effectName];

test('meta from untracked to used', async () => {
  expect(getMeta()).toBeUndefined();
  metaManager.get(basicModel.name, effectName);
  expect(getMeta()).toBeUndefined();

  const promise = basicModel[effectName]();
  expect(getMeta()).toMatchObject<MetaStateItem>({ loading: true });

  await promise;
  expect(getMeta()).toMatchObject<MetaStateItem>({ loading: false });
});
