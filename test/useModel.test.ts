import { act } from '@testing-library/react';
import { renderHook } from './helpers/renderHook';
import { FocaProvider, store, useModel } from '../src';
import { basicModel, basicSkipRefreshModel } from './models/basicModel';
import { complexModel } from './models/complexModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('get state from one model', () => {
  const { result } = renderHook(() => useModel(basicModel), {
    wrapper: FocaProvider,
  });

  expect(result.current.count).toEqual(0);

  act(() => {
    basicModel.plus(1);
  });

  expect(result.current.count).toEqual(1);
});

test('get state from multiple models', () => {
  const { result } = renderHook(() => useModel(basicModel, complexModel), {
    wrapper: FocaProvider,
  });

  expect(result.current).toMatchObject({
    basic: {},
    complex: {},
  });

  act(() => {
    basicModel.plus(1);
    complexModel.addUser(10, 'Lucifer');
  });

  expect(result.current.basic.count).toEqual(1);
  expect(result.current.complex.users[10]).toEqual('Lucifer');
});

test('get state with selector', () => {
  const { result } = renderHook(
    () => useModel(basicModel, (state) => state.count * 10),
    {
      wrapper: FocaProvider,
    },
  );

  expect(result.current).toEqual(0);

  act(() => {
    basicModel.plus(2);
  });

  expect(result.current).toEqual(20);

  act(() => {
    basicModel.plus(3);
  });

  expect(result.current).toEqual(50);
});

test('get multiple state with selector', () => {
  const { result } = renderHook(
    () => useModel(basicModel, complexModel, (a, b) => a.count + b.ids.length),
    {
      wrapper: FocaProvider,
    },
  );

  expect(result.current).toEqual(0);

  act(() => {
    basicModel.plus(1);
    complexModel.addUser(5, 'li');
    complexModel.addUser(6, 'lu');
  });

  expect(result.current).toEqual(3);
});

test('select compare algorithm', async () => {
  const hookA = renderHook(
    () =>
      useModel(
        basicModel,
        complexModel,
        (a, b) => ({
          a,
          b,
        }),
        'strictEqual',
      ),
    {
      wrapper: FocaProvider,
    },
  );
  const prevValueA = hookA.result.current;
  act(() => {
    hookA.rerender();
  });
  expect(hookA.result.current !== prevValueA).toBeTruthy();

  const hookB = renderHook(
    () =>
      useModel(
        basicModel,
        complexModel,
        (a, b) => ({
          a,
          b,
        }),
        'shallowEqual',
      ),
    {
      wrapper: FocaProvider,
    },
  );
  const prevValueB = hookB.result.current;
  act(() => {
    hookB.rerender();
  });
  expect(hookB.result.current === prevValueB).toBeTruthy();

  const hookC = renderHook(
    () =>
      useModel(
        basicModel,
        complexModel,
        (a, b) => ({
          a,
          b,
        }),
        'deepEqual',
      ),
    {
      wrapper: FocaProvider,
    },
  );
  const prevValueC = hookC.result.current;
  act(() => {
    hookC.rerender();
  });
  expect(hookC.result.current === prevValueC).toBeTruthy();
});

test('Memoize the selector result', () => {
  const fn1 = jest.fn();
  const fn2 = jest.fn();

  const { result: result1 } = renderHook(
    () => {
      return useModel(basicModel, (state) => {
        fn1();
        return state.count;
      });
    },
    {
      wrapper: FocaProvider,
    },
  );

  const { result: result2 } = renderHook(
    () => {
      return useModel(basicModel, basicSkipRefreshModel, (state1, state2) => {
        fn2();
        return state1.count + state2.count;
      });
    },
    {
      wrapper: FocaProvider,
    },
  );

  expect(fn1).toBeCalledTimes(1);
  expect(fn2).toBeCalledTimes(1);

  act(() => {
    basicModel.plus(6);
  });

  expect(result1.current).toBe(6);
  expect(result2.current).toBe(6);
  expect(fn1).toBeCalledTimes(3);
  expect(fn2).toBeCalledTimes(3);

  act(() => {
    // Sure not basicModel, we need trigger subscriptions
    complexModel.addUser(1, '');
  });
  expect(result1.current).toBe(6);
  expect(result2.current).toBe(6);
  expect(fn1).toBeCalledTimes(3);
  expect(fn2).toBeCalledTimes(3);

  act(() => {
    // Sure not basicModel, we need trigger subscriptions
    complexModel.addUser(2, 'L');
  });
  expect(result1.current).toBe(6);
  expect(result2.current).toBe(6);
  expect(fn1).toBeCalledTimes(3);
  expect(fn2).toBeCalledTimes(3);

  act(() => {
    basicModel.plus(1);
  });
  expect(result1.current).toBe(7);
  expect(result2.current).toBe(7);
  expect(fn1).toBeCalledTimes(5);
  expect(fn2).toBeCalledTimes(5);

  act(() => {
    basicSkipRefreshModel.plus(1);
  });
  expect(result1.current).toBe(7);
  expect(result2.current).toBe(8);
  expect(fn1).toBeCalledTimes(5);
  expect(fn2).toBeCalledTimes(7);

  fn1.mockRestore();
  fn2.mockRestore();
});

test('Hooks keep working after hot reload', async () => {
  const { result } = renderHook(() => useModel(basicModel), {
    wrapper: FocaProvider,
  });

  expect(result.current.count).toEqual(0);

  store.init();

  act(() => {
    basicModel.plus(1);
  });

  expect(result.current.count).toEqual(1);
});

test.skip('type checking', () => {
  const basic = useModel(basicModel);
  basic.count.toFixed();
  basic.hello.trim();
  // @ts-expect-error
  basic.notExist;

  const count = useModel(basicModel, (state) => state.count);
  count.toFixed();
  // @ts-expect-error
  count.trim();

  const obj = useModel(basicModel, complexModel);
  obj.basic.count.toFixed();
  obj.complex.ids.entries();
  // @ts-expect-error
  obj.notExists;

  const hello = useModel(
    basicModel,
    complexModel,
    (basic, complex) => basic.hello + complex.ids.length,
  );

  hello.trim();
  // @ts-expect-error
  hello.toFixed();
});
