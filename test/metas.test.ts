import { getLoading, getMeta, getMetas, store } from '../src';
import { getLoadings } from '../src/metas/getLoadings';
import { basicModel } from './models/basic-model';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('Collect multiple loading status for effect method', async () => {
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

test('Collect multiple error message for effect method', async () => {
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
