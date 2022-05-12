import { FUNCTION, isFunction, isObject } from './isType';

const hasPromise = typeof Promise === FUNCTION;

export const isPromise = <T>(value: any): value is Promise<T> => {
  return (
    (hasPromise && value instanceof Promise) ||
    ((isObject(value) || isFunction(value)) && isFunction(value.then))
  );
};
