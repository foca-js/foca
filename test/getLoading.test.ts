import { expectType } from 'ts-expect';
import { getLoading, store } from '../src';
import { loadingStore } from '../src/store/loadingStore';
import { basicModel } from './models/basicModel';

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

  const promise = basicModel.hasError();
  expect(getLoading(basicModel.hasError)).toBeTruthy();

  await expect(promise).rejects.toThrowError('my-test');

  expect(getLoading(basicModel.hasError)).toBeFalsy();
});

test('Loading is unsupported for non-async effect method', () => {
  expectType<boolean>(getLoading(basicModel.foo));
  expectType<boolean>(getLoading(basicModel.foo.room).find('xx'));
  expectType<boolean>(getLoading(basicModel.foo.room, 'xx'));
  // @ts-expect-error
  getLoading(basicModel.foo.room, basicModel.foo);
  // @ts-expect-error
  getLoading(basicModel.foo.room, true);
  // @ts-expect-error
  getLoading(basicModel.foo.room, false);
  // @ts-expect-error
  getLoading(basicModel.normalMethod.room);
});

test('Trace loadings', async () => {
  expect(getLoading(basicModel.bos.room, 'x')).toBeFalsy();
  expect(getLoading(basicModel.bos.room).find('x')).toBeFalsy();

  const promise = basicModel.bos.room('x').execute();
  expect(getLoading(basicModel.bos.room, 'x')).toBeTruthy();
  expect(getLoading(basicModel.bos.room).find('x')).toBeTruthy();
  expect(getLoading(basicModel.bos.room, 'y')).toBeFalsy();
  expect(getLoading(basicModel.bos.room).find('y')).toBeFalsy();
  expect(getLoading(basicModel.bos)).toBeFalsy();

  await promise;
  expect(getLoading(basicModel.bos.room, 'x')).toBeFalsy();
  expect(getLoading(basicModel.bos.room).find('x')).toBeFalsy();
});

test('loadings are frozen', async () => {
  loadingStore.activate(basicModel.name, 'pureAsync');

  const promise = basicModel.pureAsync();
  expect(Object.isFrozen(getLoading(basicModel.pureAsync.room))).toBeTruthy();

  await promise;
  expect(Object.isFrozen(getLoading(basicModel.pureAsync.room))).toBeTruthy();
});
