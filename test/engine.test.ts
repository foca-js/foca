import 'fake-indexeddb/auto';
import localforage from 'localforage';
import ReactNativeStorage from '@react-native-async-storage/async-storage';
import { toPromise } from '../src/utils/to-promise';
import { memoryStorage } from '../src';

const storages = [
  [localStorage, 'local'],
  [sessionStorage, 'session'],
  [memoryStorage, 'memory'],
  [
    localforage.createInstance({ driver: localforage.LOCALSTORAGE }),
    'localforage local',
  ],
  [
    localforage.createInstance({ driver: localforage.INDEXEDDB }),
    'localforage indexedDb',
  ],
  [ReactNativeStorage, 'react-native'],
] as const;

describe.each(storages)('storage io', (storage, name) => {
  beforeEach(() => storage.clear());
  afterEach(() => storage.clear());

  test(`[${name}] Get and set data`, async () => {
    await expect(toPromise(() => storage.getItem('test1'))).resolves.toBeNull();
    await storage.setItem('test1', 'yes');
    await expect(toPromise(() => storage.getItem('test1'))).resolves.toBe(
      'yes',
    );
  });

  test(`[${name}] Update data`, async () => {
    await storage.setItem('test2', 'yes');
    await expect(toPromise(() => storage.getItem('test2'))).resolves.toBe(
      'yes',
    );
    await storage.setItem('test2', 'no');
    await expect(toPromise(() => storage.getItem('test2'))).resolves.toBe('no');
  });

  test(`[${name}] Delete data`, async () => {
    await storage.setItem('test3', 'yes');
    await expect(toPromise(() => storage.getItem('test3'))).resolves.toBe(
      'yes',
    );
    await storage.removeItem('test3');
    await expect(toPromise(() => storage.getItem('test3'))).resolves.toBeNull();
  });

  test(`[${name}] Clear all data`, async () => {
    await storage.setItem('test4', 'yes');
    await storage.setItem('test5', 'yes');

    await storage.clear();

    await expect(toPromise(() => storage.getItem('test4'))).resolves.toBeNull();
    await expect(toPromise(() => storage.getItem('test5'))).resolves.toBeNull();
  });
});
