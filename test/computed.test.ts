import { store } from '../src';
import { ComputedValue } from '../src/computed/ComputedValue';
import { depsCollector } from '../src/computed/depsCollector';
import { ObjectProxy } from '../src/computed/ObjectProxy';
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
    const proxy = new ObjectProxy('x', mockStore);
    const proxyState = proxy.start(mockState);
    proxyState.a.b;
    proxyState.a.b.c;
  });
  deps.forEach((dep) => dep.end());

  expect(deps).toHaveLength(2);
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
  expect(deps[1]!.isDirty()).toBeFalsy();

  deps = depsCollector.produce(() => {
    const proxy = new ObjectProxy('x', mockStore);
    const proxyState = proxy.start(mockState);
    proxyState.a.b;
  });
  deps.forEach((dep) => dep.end());
  expect(deps).toHaveLength(1);
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
  let deps = depsCollector.produce(() => {
    const proxy = new ObjectProxy('x', mockStore);
    proxyState = proxy.start(mockState);
  });
  deps.forEach((dep) => dep.end());

  expect(() => proxyState.a).toThrowError();
});

test('ComputedValue can remove duplicated deps', () => {
  const computedValue = new ComputedValue(
    {
      name: computedModel.name,
      get state() {
        return computedModel.state;
      },
    },
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

  expect(computedValue.deps).toHaveLength(2);

  computedModel.changeFirstName('hello');
  expect(computedValue.isDirty()).toBeTruthy();

  computedModel.changeLastName('world');
  expect(computedValue.isDirty()).toBeTruthy();

  computedModel.changeFirstName('hello');
  computedModel.changeLastName('world');
  expect(computedValue.isDirty()).toBeFalsy();
});

test.skip('type checking', () => {
  computedModel.fullName;
  // @ts-expect-error
  computedModel._privateFullname;
});
