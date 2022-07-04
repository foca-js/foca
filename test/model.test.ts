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

test('Set state in effects', async () => {
  expect(basicModel.state.count).toBe(0);
  expect(basicModel.state.hello).toBe('world');

  await expect(basicModel.foo('earth', 15)).resolves.toBe('OK');

  expect(basicModel.state.count).toBe(15);
  expect(basicModel.state.hello).toBe('earth');
});

test('Set state without function callback in effects', () => {
  expect(basicModel.state.count).toBe(0);

  basicModel.setWithoutFn(15);
  expect(basicModel.state.count).toBe(15);

  basicModel.setWithoutFn(26);
  expect(basicModel.state.count).toBe(26);

  basicModel.setWithoutFn(54.3);
  expect(basicModel.state.count).toBe(54.3);
});

test('set partial object state in effects', () => {
  const model = defineModel('partial-object-model', {
    initialState: <
      { test: { count: number }; hello: string | undefined; name: string }
    >{
      test: {
        count: 0,
      },
      hello: 'world',
      name: 'timi',
    },
    effects: {
      setNothing() {
        this.setState({});
      },
      setCount() {
        this.setState({
          test: {
            count: 2,
          },
        });
      },
      setHello() {
        this.setState({
          hello: 'x',
        });
      },
      override() {
        this.setState({
          // @ts-expect-error
          test: 123,
        });
      },
      doNotSetUndefined() {
        this.setState({
          hello: undefined,
        });
        this.setState({
          // @ts-expect-error
          test: undefined,
          // @ts-expect-error
          name: undefined,
        });
        this.setState({
          test: {
            // @ts-expect-error
            count: undefined,
          },
        });
      },
    },
  });

  model.setCount();
  expect(model.state.test).toStrictEqual({
    count: 2,
  });
  expect(model.state.hello).toBe('world');

  model.setHello();
  expect(model.state.test).toStrictEqual({
    count: 2,
  });
  expect(model.state.hello).toBe('x');

  model.setNothing();
  expect(model.state.test).toStrictEqual({
    count: 2,
  });
  expect(model.state.hello).toBe('x');

  model.override();
  expect(model.state.test).toBe(123);
});

test('set partial array state in effects', () => {
  const model = defineModel('partial-array-model', {
    initialState: ['2'],
    effects: {
      set() {
        this.setState(['20', '30']);
      },
      doNotUndefined() {
        // @ts-expect-error
        this.setState(['20', '30', undefined]);
        // @ts-expect-error
        this.setState(undefined);
        // @ts-expect-error
        this.setState();
      },
    },
  });

  model.set();
  expect(model.state).toStrictEqual(['20', '30']);
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
