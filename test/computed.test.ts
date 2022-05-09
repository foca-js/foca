import { expectType } from 'ts-expect';
import { defineModel, store, ComputedRef } from '../src';
import { ComputedDeps } from '../src/reactive/ComputedDeps';
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

test('Computed function instance of ComputedValue', () => {
  expect(computedModel.fullName).toBeInstanceOf(ComputedValue);
  expect(computedModel.isOnline).toBeInstanceOf(ComputedValue);
});

test('Get computed value', () => {
  expect(computedModel.fullName.value).toBe('ticktock');
  computedModel.changeFirstName('hello');
  expect(computedModel.fullName.value).toBe('hellotock');
  computedModel.changeLastName('world');
  expect(computedModel.fullName.value).toBe('helloworld');
});

test('Get computed value in computed function', () => {
  expect(computedModel.testDependentOtherComputed.value).toBe(
    'ticktock [online]',
  );
});

test('Can return correct result from Object.keys', () => {
  expect(computedModel.testObjectKeys.value).toMatchObject(
    expect.arrayContaining(['online', 'offline']),
  );
});

test('can return correct length from array', () => {
  expect(computedModel.testArrayLength.value).toBe(2);
});

test('Can throw error with circularly reference', () => {
  expect(() => computedModel.a.value).toThrowError('circularly reference');
  expect(() => computedModel.b.value).toThrowError('circularly reference');
  expect(() => computedModel.c.value).toThrowError('circularly reference');
});

test('Can visit compute value from effects', () => {
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

test('Unable to visit proxy state outside collecting mode', () => {
  let mockState = { a: { b: { c: 'd' } } };
  const mockStore = {
    getState() {
      return {
        x: mockState,
      };
    },
  };

  let proxyState: typeof mockState;
  depsCollector.produce(() => {
    proxyState = new ObjectDeps(mockStore, 'x').start(mockState);
  });

  expect(() => proxyState.a).toThrowError();
});

test('ComputedValue can remove duplicated deps', () => {
  const mockStore = {
    getState() {
      return {
        [computedModel.name]: computedModel.state,
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
      computedModel.fullName.value;
      computedModel.fullName.value;
    },
  );

  // Collecting
  computedValue.value;

  expect(computedValue.deps).toHaveLength(3);
});

test('ComputedValue can be a copy deps', () => {
  const mockStore = {
    getState() {
      return {
        [computedModel.name]: computedModel.state,
      };
    },
  };

  const computedValue = new ComputedValue(
    mockStore,
    computedModel.name,
    'prop',
    () => {
      return computedModel.fullName.value + '-abc';
    },
  );

  // Collecting
  computedValue.value;

  expect(computedValue.deps).toHaveLength(1);
  expect(computedValue.deps[0]).toBeInstanceOf(ComputedDeps);
  expect(computedValue.deps[0]).not.toBe(computedModel.fullName);

  const fullNameAsRef = computedModel.fullName as ComputedValue;

  expect(fullNameAsRef.isDirty()).toBeFalsy();

  computedModel.changeFirstName('z-');
  expect(fullNameAsRef.isDirty()).toBeTruthy();
  expect(computedValue.deps[0]!.isDirty()).toBeTruthy();
  expect(fullNameAsRef.isDirty()).toBeFalsy();

  expect(fullNameAsRef.value).toBe('z-tock');

  expect(computedValue.deps[0]!.isDirty()).toBeTruthy();
  expect(computedValue.value).toBe('z-tock-abc');
  expect(computedValue.deps[0]!.isDirty()).toBeFalsy();

  computedModel.changeFirstName('z-to');
  computedModel.changeLastName('ck');
  expect(fullNameAsRef.isDirty()).toBeTruthy();
  expect(computedValue.deps[0]!.isDirty()).toBeFalsy();
  expect(computedValue.isDirty()).toBeFalsy();
});

test('only execute computed function when deps changed', () => {
  const spy = jest.fn().mockImplementation(() => {
    model.state.a;
  });

  const model = defineModel('x' + Math.random(), {
    initialState: {
      a: 0,
      b: 2,
    },
    actions: {
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

  model.testa.value;
  expect(spy).toBeCalledTimes(1);

  model.testa.value;
  expect(spy).toBeCalledTimes(1);

  model.updateB();
  model.testa.value;
  expect(spy).toBeCalledTimes(1);

  model.updateA();
  model.testa.value;
  expect(spy).toBeCalledTimes(2);

  model.testa.value;
  expect(spy).toBeCalledTimes(2);
});

test('Can handle JSON.stringify', () => {
  expect(computedModel.testJSON.value).toBe(
    JSON.stringify(computedModel.state),
  );
});

test('Fail to set value on proxy state', () => {
  expect(() => computedModel.testExtendObject.value).toThrowError();
  expect(() => computedModel.testModifyValue.value).toThrowError();
});

test('Type checking', () => {
  expectType<ComputedRef<string>>(computedModel.fullName);
  // @ts-expect-error
  computedModel._privateFullname;
});
