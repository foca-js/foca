import { store } from '../src';
import { StoreError } from '../src/exceptions/StoreError';

test('Store will throw error before initialize', () => {
  expect(() => store.getState()).toThrow(StoreError);
});

test('Method replaceReducer is deprecated', () => {
  expect(() => store.replaceReducer()).toThrow(StoreError);
});
