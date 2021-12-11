import { store } from '../src';
import { metaStore } from '../src/store/metaStore';
import { basicModel } from './models/basicModel';
import { complexModel } from './models/complexModel';
import { storeUnmount } from './utils/store';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  storeUnmount();
});

test('dispatch the same state should be intercepted', () => {
  const fn = jest.fn();
  const unsubscribe = store.subscribe(fn);

  expect(fn).toHaveBeenCalledTimes(0);
  basicModel.set(100);
  expect(fn).toHaveBeenCalledTimes(1);
  basicModel.set(100);
  basicModel.set(100);
  expect(fn).toHaveBeenCalledTimes(1);
  basicModel.set(101);
  expect(fn).toHaveBeenCalledTimes(2);

  complexModel.deleteUser(30);
  complexModel.deleteUser(34);
  expect(fn).toHaveBeenCalledTimes(2);

  complexModel.addUser(5, 'L');
  expect(fn).toHaveBeenCalledTimes(3);
  complexModel.addUser(5, 'L');
  expect(fn).toHaveBeenCalledTimes(3);
  complexModel.addUser(5, 'LT');
  expect(fn).toHaveBeenCalledTimes(4);

  unsubscribe();
  fn.mockRestore();
});

test('dispatch the same meta should be intercepted', async () => {
  const fn = jest.fn();
  const unsubscribe = metaStore.subscribe(fn);

  metaStore.helper.inactivate(
    metaStore.helper.keyOf(basicModel.name, 'pureAsync'),
  );

  expect(fn).toHaveBeenCalledTimes(0);
  await basicModel.pureAsync();
  await basicModel.pureAsync();
  expect(fn).toHaveBeenCalledTimes(0);

  metaStore.helper.activate(
    metaStore.helper.keyOf(basicModel.name, 'pureAsync'),
  );

  await basicModel.pureAsync();
  expect(fn).toHaveBeenCalledTimes(2);
  await basicModel.pureAsync();
  await basicModel.pureAsync();
  expect(fn).toHaveBeenCalledTimes(6);
  await Promise.all([basicModel.pureAsync(), basicModel.pureAsync()]);
  expect(fn).toHaveBeenCalledTimes(8);

  unsubscribe();
  fn.mockRestore();
});
