import 'fake-indexeddb/auto';
import localforage from 'localforage';
import ReactNativeStorage from '@react-native-async-storage/async-storage';
import { engines } from '../src';
import { toPromise } from '../src/utils/to-promise';

const storages = [
  [engines.localStorage, localStorage, 'local'],
  [engines.sessionStorage, sessionStorage, 'session'],
  [engines.memoryStorage, undefined, 'memory'],
  [
    localforage.createInstance({ driver: localforage.LOCALSTORAGE }),
    undefined,
    'localforage local',
  ],
  [
    localforage.createInstance({ driver: localforage.INDEXEDDB }),
    undefined,
    'localforage indexedDb',
  ],
  [ReactNativeStorage, undefined, 'react-native'],
] as const;

describe.each(storages)('storage io', (storage, syncOrigin, name) => {
  beforeEach(() => storage.clear());
  afterEach(() => storage.clear());

  test(`[${name}] Get and set data`, async () => {
    if (syncOrigin) {
      expect(syncOrigin.getItem('test1')).toBeNull();
    }

    await expect(toPromise(() => storage.getItem('test1'))).resolves.toBeNull();
    await storage.setItem('test1', 'yes');
    await expect(toPromise(() => storage.getItem('test1'))).resolves.toBe(
      'yes',
    );

    if (syncOrigin) {
      expect(syncOrigin.getItem('test1')).toBe('yes');
    }
  });

  test(`[${name}] Update data`, async () => {
    await storage.setItem('test2', 'yes');
    await expect(toPromise(() => storage.getItem('test2'))).resolves.toBe(
      'yes',
    );
    await storage.setItem('test2', 'no');
    await expect(toPromise(() => storage.getItem('test2'))).resolves.toBe('no');

    if (syncOrigin) {
      expect(syncOrigin.getItem('test2')).toBe('no');
    }
  });

  test(`[${name}] Delete data`, async () => {
    await storage.setItem('test3', 'yes');
    await expect(toPromise(() => storage.getItem('test3'))).resolves.toBe(
      'yes',
    );
    await storage.removeItem('test3');
    await expect(toPromise(() => storage.getItem('test3'))).resolves.toBeNull();

    if (syncOrigin) {
      expect(syncOrigin.getItem('test3')).toBeNull();
    }
  });

  test(`[${name}] Clear all data`, async () => {
    await storage.setItem('test4', 'yes');
    await storage.setItem('test5', 'yes');

    await storage.clear();

    await expect(toPromise(() => storage.getItem('test4'))).resolves.toBeNull();
    await expect(toPromise(() => storage.getItem('test5'))).resolves.toBeNull();

    if (syncOrigin) {
      expect(syncOrigin.getItem('test4')).toBeNull();
      expect(syncOrigin.getItem('test5')).toBeNull();
    }
  });
});
