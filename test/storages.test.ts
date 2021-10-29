import { engine } from '../src';

const storages = [
  [engine.localStorage, localStorage, 'local'],
  [engine.sessionStorage, sessionStorage, 'session'],
  [engine.memoryStorage, undefined, 'memory'],
] as const;

beforeEach(() => {
  storages.forEach(([storage]) => {
    storage.clear();
  });
});

afterEach(() => {
  storages.forEach(([storage]) => {
    storage.clear?.();
  });
});

for (let [storage, origin, name] of storages) {
  test(`[${name}] Get and set data`, async () => {
    if (origin) {
      expect(origin.getItem('test1')).toBeNull();
    }

    await expect(storage.getItem('test1')).resolves.toBeNull();
    await storage.setItem('test1', 'yes');
    await expect(storage.getItem('test1')).resolves.toBe('yes');

    if (origin) {
      expect(origin.getItem('test1')).toBe('yes');
    }
  });

  test(`[${name}] Update data`, async () => {
    await storage.setItem('test2', 'yes');
    await expect(storage.getItem('test2')).resolves.toBe('yes');
    await storage.setItem('test2', 'no');
    await expect(storage.getItem('test2')).resolves.toBe('no');

    if (origin) {
      expect(origin.getItem('test2')).toBe('no');
    }
  });

  test(`[${name}] Delete data`, async () => {
    await storage.setItem('test3', 'yes');
    await expect(storage.getItem('test3')).resolves.toBe('yes');
    await storage.removeItem('test3');
    await expect(storage.getItem('test3')).resolves.toBeNull();

    if (origin) {
      expect(origin.getItem('test3')).toBeNull();
    }
  });

  test(`[${name}] Clear all data`, async () => {
    await storage.setItem('test4', 'yes');
    await storage.setItem('test5', 'yes');

    await storage.clear();

    await expect(storage.getItem('test4')).resolves.toBeNull();
    await expect(storage.getItem('test5')).resolves.toBeNull();

    if (origin) {
      expect(origin.getItem('test4')).toBeNull();
      expect(origin.getItem('test5')).toBeNull();
    }
  });
}
