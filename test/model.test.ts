import { defineModel, store } from '../src';
import { basicModel } from './models/basicModel';
import { complexModel } from './models/complexModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
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

test('Support generator function', async () => {
  const promise = complexModel.generatorFn(15);

  expect(complexModel.state.ids).toHaveLength(0);
  await expect(promise).resolves.toBe('generator fn');
  expect(complexModel.state.ids).toHaveLength(1);
  expect(complexModel.state.ids[0]).toBe(15);
});

test('Support async generator function', async () => {
  const promise = complexModel.asyncGeneratorFn(17);

  expect(complexModel.state.ids).toHaveLength(0);
  await expect(promise).resolves.toBe('async generator fn');
  expect(complexModel.state.ids).toHaveLength(1);
  expect(complexModel.state.ids[0]).toBe(17);
});

test.skip('type checking', () => {
  complexModel
    .generatorFn(1)
    .then((value) => value.trim())
    .catch();

  complexModel
    .asyncGeneratorFn(1)
    .then((value) => value.trim())
    .catch();
});
