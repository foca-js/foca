export const OBJECT = 'object';
export const FUNCTION = 'function';

export const isFunction = <T extends Function>(value: any): value is T =>
  !!value && typeof value === FUNCTION;

export const isObject = <T extends object>(value: any): value is T =>
  !!value && typeof value === OBJECT;

export const isString = <T extends string>(value: any): value is T =>
  typeof value === 'string';
