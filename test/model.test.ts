import { defineModel, store } from '../src';
import { basicModel } from './models/basicModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('Model name', () => {
  expect(basicModel.name).toBe('basic');
});

test('initialState should be serializable', () => {
  const createModel = (initialState: any) => {
    return defineModel('model' + Math.random(), { initialState });
  };

  [
    { x: Symbol('test') },
    [Symbol('test')],
    { x: function () {} },
    { x: /test/ },
    { x: new Map() },
    { x: new Set() },
    { x: new Date() },
    [new (class {})()],
    new (class {})(),
  ].forEach((initialState) => {
    expect(() => createModel(initialState)).toThrowError();
  });

  [
    { x: undefined },
    { x: undefined, y: null },
    { x: 0 },
    [0, 1, '2', {}, { x: null }],
    { x: { y: { z: [{}, {}] } } },
  ].forEach((initialState) => {
    createModel(initialState);
  });
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

test('define duplicated method keys will throw error', () => {
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

  expect(() =>
    defineModel('x' + Math.random(), {
      initialState: {},
      actions: {
        test2() {},
      },
      computed: {
        test1() {},
        test2() {},
      },
    }),
  ).toThrowError('test2');

  expect(() =>
    defineModel('x' + Math.random(), {
      initialState: {},
      effects: {
        test2() {},
      },
      computed: {
        test1() {},
        test2() {},
      },
    }),
  ).toThrowError('test2');
});

test('Warning when using deprecated hooks field', () => {
  const spy = jest.spyOn(console, 'warn');
  defineModel('hooks' + Math.random(), {
    initialState: {},
    hooks: {},
  });
  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockRestore();
});
