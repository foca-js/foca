import { FUNCTION } from './is-type';

/**
 * Inlined version of the `symbol-observable` polyfill
 * @link https://github.com/reduxjs/redux/blob/master/src/utils/symbol-observable.ts
 */
export const $$observable: typeof Symbol.observable =
  (typeof Symbol === FUNCTION && Symbol.observable) ||
  ('@@observable' as unknown as typeof Symbol.observable);
