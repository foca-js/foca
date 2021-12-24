import { coroutine, isGenerator } from '../src/utils/coroutine';

test('validate generator function', () => {
  expect(isGenerator((function () {})())).toBeFalsy();
  expect(isGenerator((async function () {})())).toBeFalsy();

  expect(isGenerator((function* () {})())).toBeTruthy();
  expect(isGenerator((async function* () {})())).toBeTruthy();

  expect(isGenerator((function* test() {})())).toBeTruthy();
  expect(isGenerator((async function* test1() {})())).toBeTruthy();
});

test('yield number', async () => {
  await expect(
    coroutine(
      (function* () {
        yield 20;
        return 345;
      })(),
    ),
  ).resolves.toBe(345);

  await expect(
    coroutine(
      (function* () {
        yield 20;
        yield 30;
        return 3456;
      })(),
    ),
  ).resolves.toBe(3456);
});

test('yield string', async () => {
  await expect(
    coroutine(
      (function* () {
        yield 'test';
        return 'hello world';
      })(),
    ),
  ).resolves.toBe('hello world');
});

test('yield Promise', async () => {
  await expect(
    coroutine(
      (function* () {
        const result = yield Promise.resolve('test1');
        return result + 'test2';
      })(),
    ),
  ).resolves.toBe('test1test2');
});

test('yield Generator', async () => {
  await expect(
    coroutine(
      (function* () {
        const result = yield (function* () {
          return yield 'test1';
        })();
        return result + 'test2';
      })(),
    ),
  ).resolves.toBe('test1test2');

  await expect(
    coroutine(
      (function* () {
        const result = yield (async function* () {
          return await 'test1';
        })();
        return result + 'test2';
      })(),
    ),
  ).resolves.toBe('test1test2');
});

test('yield multiple times', async () => {
  await expect(
    coroutine(
      (function* () {
        const result1 = yield Promise.resolve('test1');
        const result2 = yield result1 + '234';
        return result2 + 'test2';
      })(),
    ),
  ).resolves.toBe('test1234test2');
});

test('async yield', async () => {
  await expect(
    coroutine(
      (async function* () {
        const result1 = yield Promise.resolve('test1');
        const result2 = yield result1 + '234';
        const result3 = await Promise.resolve(result2 + '567');
        return result3 + 'test2';
      })(),
    ),
  ).resolves.toBe('test1234567test2');
});

test('should reject', async () => {
  await expect(
    coroutine(
      (function* () {
        yield Promise.resolve('test1');
        throw new Error('zzzz');
      })(),
    ),
  ).rejects.toThrowError();

  await expect(
    coroutine(
      (async function* () {
        await Promise.resolve('test1');
        yield {};
        throw new Error('zzzz');
      })(),
    ),
  ).rejects.toThrowError();
});

test('should not yield generator function', async () => {
  const genFn = function* genFn() {
    return yield 'test me';
  };

  await expect(
    coroutine(
      (function* () {
        return yield genFn;
      })(),
    ),
  ).resolves.toBe(genFn);

  await expect(
    coroutine(
      (async function* () {
        return yield genFn;
      })(),
    ),
  ).resolves.toBe(genFn);
});
