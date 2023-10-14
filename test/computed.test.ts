import { defineModel, store } from '../src';
import { ComputedValue } from '../src/reactive/ComputedValue';
import { depsCollector } from '../src/reactive/depsCollector';
import { ObjectDeps } from '../src/reactive/ObjectDeps';
import { computedModel } from './models/computedModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('Get computed value', () => {
  expect(computedModel.fullName()).toBe('ticktock');
  computedModel.changeFirstName('hello');
  expect(computedModel.fullName()).toBe('hellotock');
  computedModel.changeLastName('world');
  expect(computedModel.fullName()).toBe('helloworld');
});

test('Get computed value in computed function', () => {
  expect(computedModel.testDependentOtherComputed()).toBe('ticktock [online]');
});

test('Can return correct result from Object.keys', () => {
  expect(computedModel.testObjectKeys()).toMatchObject(
    expect.arrayContaining(['online', 'offline']),
  );
});

test('can enum all items for find method', () => {
  expect(computedModel.testFind()).toBe('offline');
});

test('can visit array item', () => {
  expect(computedModel.testVisitArray()[0]).toBe('online');
});

test('can return correct length from array', () => {
  expect(computedModel.testArrayLength()).toBe(2);
});

test('Can throw error with circularly reference', () => {
  const model = defineModel('computed-cycle-usage', {
    initialState: {},
    computed: {
      a() {
        this.b();
      },
      b() {
        this.c();
      },
      c() {
        this.a();
      },
    },
  });

  expect(() => model.a()).toThrowError('循环引用');
  expect(() => model.b()).toThrowError('循环引用');
  expect(() => model.c()).toThrowError('循环引用');
});

test('Can visit compute value from methods', () => {
  expect(computedModel.effectsGetFullName()).toBe('ticktock');
});

test('Split the deps for same getters', () => {
  let mockState = { a: { b: { c: 'd' } } };
  const mockStore = {
    getState() {
      return {
        x: mockState,
      };
    },
  };

  let deps = depsCollector.produce(() => {
    const proxy = new ObjectDeps(mockStore, 'x');
    const proxyState = proxy.start(mockState);
    proxyState.a.b;
    proxyState.a.b.c;
  });
  expect(deps).toHaveLength(2);

  deps = depsCollector.produce(() => {
    const proxy = new ObjectDeps(mockStore, 'x');
    const proxyState = proxy.start(mockState);
    proxyState.a.b;
  });
  expect(deps).toHaveLength(1);
});

test('Dirty deps never turn to clean', () => {
  let mockState = { a: { b: { c: 'd' } } };
  const mockStore = {
    getState() {
      return {
        x: mockState,
      };
    },
  };

  let deps = depsCollector.produce(() => {
    const proxy = new ObjectDeps(mockStore, 'x');
    const proxyState = proxy.start(mockState);
    proxyState.a.b;
    proxyState.a.b.c;
  });

  expect(deps[0]!.isDirty()).toBeFalsy();
  expect(deps[1]!.isDirty()).toBeFalsy();

  mockState = { a: { b: { c: 'd' } } };
  expect(deps[0]!.isDirty()).toBeTruthy();
  expect(deps[1]!.isDirty()).toBeFalsy();

  // @ts-expect-error
  mockState = { a: { b: 'm' } };
  expect(deps[0]!.isDirty()).toBeTruthy();
  expect(deps[1]!.isDirty()).toBeTruthy();

  mockState = { a: { b: { c: 'e' } } };
  expect(deps[0]!.isDirty()).toBeTruthy();
  expect(deps[1]!.isDirty()).toBeTruthy();

  mockState = { a: { b: { c: 'e' } } };
  expect(deps[0]!.isDirty()).toBeTruthy();
  expect(deps[1]!.isDirty()).toBeTruthy();
});

test('visit proxy state without collecting mode should not collect deps', () => {
  let mockState = { a: { b: { c: 'd' } } };
  const mockStore = {
    getState() {
      return {
        x: mockState,
      };
    },
  };

  const spy = vitest.spyOn(depsCollector, 'append');

  let proxyState!: typeof mockState;
  depsCollector.produce(() => {
    proxyState = new ObjectDeps(mockStore, 'x').start(mockState);
    proxyState.a;
    proxyState.a.b;
  });
  expect(spy).toHaveBeenCalledTimes(2);

  spy.mockClear();
  expect(proxyState.a).toMatchObject({
    b: {
      c: 'd',
    },
  });
  expect(proxyState.a.b).toMatchObject({
    c: 'd',
  });
  expect(spy).toHaveBeenCalledTimes(0);

  spy.mockClear();
  depsCollector.produce(() => {
    const custom = new ObjectDeps(mockStore, 'x').start(mockState);
    custom.a;

    proxyState.a;
    proxyState.a.b;
    proxyState.a.b.c;
  });
  expect(spy).toHaveBeenCalledTimes(1);
});

test('ComputedValue can remove duplicated deps', () => {
  const mockStore = {
    getState() {
      return {
        [computedModel.name]: store.getState()[computedModel.name],
      };
    },
  };

  const computedValue = new ComputedValue(
    mockStore,
    computedModel.name,
    'prop',
    () => {
      computedModel.state.firstName;
      computedModel.state.firstName;
      computedModel.state.lastName;
      computedModel.fullName();
      computedModel.fullName();
    },
  );

  // Collecting
  computedValue.value;

  expect(computedValue.deps).toHaveLength(3);
});

test('only execute computed function when deps changed', () => {
  const spy = vitest.fn().mockImplementation(() => {
    model.state.a;
  });

  const model = defineModel('x' + Math.random(), {
    initialState: {
      a: 0,
      b: 2,
    },
    reducers: {
      updateA(state) {
        state.a += 1;
      },
      updateB(state) {
        state.b += 1;
      },
    },
    computed: {
      testa: spy,
    },
  });

  expect(spy).toBeCalledTimes(0);

  model.testa();
  expect(spy).toBeCalledTimes(1);

  model.testa();
  expect(spy).toBeCalledTimes(1);

  model.updateB();
  model.testa();
  expect(spy).toBeCalledTimes(1);

  model.updateA();
  model.testa();
  expect(spy).toBeCalledTimes(2);

  model.testa();
  expect(spy).toBeCalledTimes(2);
});

test('Can handle JSON.stringify', () => {
  expect(computedModel.testJSON()).toBe(JSON.stringify(computedModel.state));
});

test('Fail to set value on proxy state', () => {
  expect(() => computedModel.testExtendObject()).toThrowError();
  expect(() => computedModel.testModifyValue()).toThrowError();
});

test('no private computed value', () => {
  // @ts-expect-error
  expect(computedModel._privateFullname).toBeUndefined();
});

test('support parameters', () => {
  expect(computedModel.withParameter(31)).toBe('tick-age-31');
  expect(computedModel.withDefaultParameter()).toBe('tick-age-20');
  expect(computedModel.withMultipleParameters(50, 'adddddr')).toBe(
    'tick-age-50-addr-adddddr',
  );
  expect(computedModel.withMultipleAndDefaultParameters(50)).toBe(
    'tick-age-50-addr-undefined',
  );
});

test('never re-calculate value with same parameters', () => {
  const spy = vitest.fn();
  const model = defineModel('computed-with-params', {
    initialState: { name: 'x' },
    computed: {
      myData(age: number, coding: boolean) {
        spy();
        return this.state.name + '-' + age + String(coding);
      },
    },
  });

  model.myData(20, true);
  expect(spy).toBeCalledTimes(1);
  model.myData(20, true);
  model.myData(20, true);
  model.myData(20, true);
  expect(spy).toBeCalledTimes(1);
  model.myData(20, false);
  expect(spy).toBeCalledTimes(2);
  model.myData(20, false);
  expect(spy).toBeCalledTimes(2);
  model.myData(34, false);
  expect(spy).toBeCalledTimes(3);
  model.myData(20, false); // cache
  expect(spy).toBeCalledTimes(3);

  spy.mockRestore();
});

test('remove computed value for cache always be skipped', () => {
  const spy = vitest.fn();
  const model = defineModel('computed-with-remove-cache', {
    initialState: { name: 'x' },
    computed: {
      myData(age: number, coding: boolean) {
        spy();
        return this.state.name + '-' + age + String(coding);
      },
    },
  });

  for (let i = 0; i < 30; ++i) {
    model.myData(i, true);
  }
  expect(spy).toBeCalledTimes(30);
  spy.mockReset();
  model.myData(1, true);
  expect(spy).toBeCalledTimes(1);
  spy.mockRestore();
});

test('complex parameter can not hit cache', () => {
  const spy = vitest.fn();
  const model = defineModel('computed-with-complex-parameter', {
    initialState: { name: 'x' },
    computed: {
      myData(opts: object) {
        spy();
        return this.state.name + '-' + JSON.stringify(opts);
      },
    },
  });

  const obj = {};
  model.myData(obj);
  expect(spy).toBeCalledTimes(1);
  model.myData(obj);
  expect(spy).toBeCalledTimes(1);
  model.myData({});
  expect(spy).toBeCalledTimes(2);
  model.myData(obj);
  expect(spy).toBeCalledTimes(2);
  spy.mockRestore();
});

test('array should always be deps', () => {
  const spy = vitest.fn();

  const model = defineModel('computed-from-array', {
    initialState: {
      x: [{ foo: 'bar' } as { foo: string; other?: string }],
      y: {},
    },
    reducers: {
      update(state, other: string) {
        state.x = [{ foo: 'bar' }, { foo: 'baz', other }];
      },
    },
    computed: {
      myData() {
        spy();
        return this.state.x.filter((item) => item.foo === 'bar');
      },
    },
  });

  model.myData();
  expect(spy).toBeCalledTimes(1);
  model.update('baz');
  model.myData();
  expect(spy).toBeCalledTimes(2);
  model.update('x');
  model.myData();
  expect(spy).toBeCalledTimes(3);
  model.update('y');
  model.myData();
  expect(spy).toBeCalledTimes(4);
});
