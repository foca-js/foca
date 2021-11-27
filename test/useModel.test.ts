import { renderHook, act } from '@testing-library/react-hooks';
import { FocaProvider, store, useModel } from '../src';
import { basicModel } from './models/basic-model';
import { complexModel } from './models/complex-model';
import { storeUnmount } from './utils/store';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  storeUnmount();
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
  expect(result.current.complex.users.get(10)).toEqual('Lucifer');
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
    () => useModel(basicModel, complexModel, (a, b) => a.count + b.ids.size),
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
    () => useModel(basicModel, complexModel, 'strictEqual'),
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
    () => useModel(basicModel, complexModel, 'shallowEqual'),
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
    () => useModel(basicModel, complexModel, 'deepEqual'),
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
    (basic, complex) => basic.hello + complex.ids.size,
  );

  hello.trim();
  // @ts-expect-error
  hello.toFixed();
});
