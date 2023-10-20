import { act } from '@testing-library/react';
import { renderHook } from './helpers/render-hook';
import { store, useComputed } from '../src';
import { computedModel } from './models/computed.model';

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

test('with parameters', () => {
  const { result } = renderHook(() =>
    useComputed(computedModel.withMultipleParameters, 43, 'address'),
  );

  expect(result.current).toEqual('tick-age-43-addr-address');

  act(() => {
    computedModel.changeFirstName('musk');
  });
  expect(result.current).toEqual('musk-age-43-addr-address');
});
