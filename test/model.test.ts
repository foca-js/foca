import { defineModel, store } from '../src';
import { basicModel } from './models/basicModel';
import { storeUnmount } from './utils/store';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  storeUnmount();
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

test('Set state without function callback in effect method', () => {
  expect(basicModel.state.count).toBe(0);

  basicModel.setWithoutFn(15);
  expect(basicModel.state.count).toBe(15);

  basicModel.setWithoutFn(26);
  expect(basicModel.state.count).toBe(26);

  basicModel.setWithoutFn(54.3);
  expect(basicModel.state.count).toBe(54.3);
});

test('private action and effect', () => {
  expect(
    // @ts-expect-error
    basicModel._actionIsPrivate,
  ).toBeUndefined();

  expect(
    // @ts-expect-error
    basicModel._effectIsPrivate,
  ).toBeUndefined();

  expect(
    // @ts-expect-error
    basicModel.____alsoPrivateAction,
  ).toBeUndefined();

  expect(
    // @ts-expect-error
    basicModel.____alsoPrivateEffect,
  ).toBeUndefined();

  expect(basicModel.plus).toBeInstanceOf(Function);
  expect(basicModel.pureAsync).toBeInstanceOf(Function);
});

test('define same method key will throw error', () => {
  expect(() =>
    defineModel('x' + Math.random(), {
      initialState: {},
      actions: {
        test1() {},
      },
      effects: {
        test1() {},
        test2() {},
      },
    }),
  ).toThrowError('test1');
});
