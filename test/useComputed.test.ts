import { act } from '@testing-library/react';
import { renderHook } from './helpers/renderHook';
import { store, useComputed } from '../src';
import { computedModel } from './models/computedModel';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('get state from computed value', () => {
  const { result } = renderHook(() => useComputed(computedModel.fullName));

  expect(result.current).toEqual('ticktock');

  act(() => {
    computedModel.changeFirstName('hello');
  });
  expect(result.current).toEqual('hellotock');

  act(() => {
    computedModel.changeFirstName('tick');
  });
  expect(result.current).toEqual('ticktock');

  act(() => {
    computedModel.changeLastName('world');
  });
  expect(result.current).toEqual('tickworld');
});
