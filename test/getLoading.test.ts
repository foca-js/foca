import { getLoading, store } from '../src';
import { loadingStore } from '../src/store/loadingStore';
import { basicModel } from './models/basicModel';
import { storeUnmount } from './utils/store';

beforeEach(() => {
  store.init();
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

  const promise = basicModel.hasError();
  expect(getLoading(basicModel.hasError)).toBeTruthy();

  await expect(promise).rejects.toThrowError('my-test');

  expect(getLoading(basicModel.hasError)).toBeFalsy();
});

test.skip('Loading is unsupported for non-async effect method', () => {
  getLoading(basicModel.foo).valueOf();

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

test('loadings are frozen', async () => {
  const combineKey = loadingStore.helper.keyOf(basicModel.name, 'pureAsync');
  loadingStore.helper.activate(combineKey);

  const promise = basicModel.pureAsync();
  expect(Object.isFrozen(getLoading(basicModel.pureAsync.assign))).toBeTruthy();

  await promise;
  expect(Object.isFrozen(getLoading(basicModel.pureAsync.assign))).toBeTruthy();
});
