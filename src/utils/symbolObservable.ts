/**
 * Inlined version of the `symbol-observable` polyfill
 * @link https://github.com/reduxjs/redux/blob/master/src/utils/symbol-observable.ts
 */
export const $$observable =
  (typeof Symbol === 'function' && Symbol.observable) ||
  ('@@observable' as unknown as symbol);
