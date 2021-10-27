import { store } from '../src';
import { basicModel } from './mock/basic-model';

beforeEach(() => {
  store.init({});
});

afterEach(() => {
  store.refresh(true);
});

test('Model name', () => {
  expect(basicModel.name).toBe('basic');
});

test('Reset model state', () => {
  basicModel.moreParams(3, 'earth');
  expect(basicModel.state.count).toBe(3);
  expect(basicModel.state.hello).toBe('world, earth');

  basicModel.reset();
  expect(basicModel.state.count).toBe(0);
  expect(basicModel.state.hello).toBe('world');
});

test('Call action', () => {
  expect(basicModel.state.count).toBe(0);

  basicModel.plus(1);
  expect(basicModel.state.count).toBe(1);

  basicModel.plus(6);
  expect(basicModel.state.count).toBe(7);

  basicModel.minus(3);
  expect(basicModel.state.count).toBe(4);
});

test('call action with multiple parameters', () => {
  expect(basicModel.state.count).toBe(0);
  expect(basicModel.state.hello).toBe('world');

  basicModel.moreParams(13, 'timi');
  expect(basicModel.state.count).toBe(13);
  expect(basicModel.state.hello).toBe('world, timi');
});

test('Set state in effect method', async () => {
  expect(basicModel.state.count).toBe(0);
  expect(basicModel.state.hello).toBe('world');

  await expect(basicModel.foo('earth', 15)).resolves.toBe('OK');

  expect(basicModel.state.count).toBe(15);
  expect(basicModel.state.hello).toBe('earth');
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
