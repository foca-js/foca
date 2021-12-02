import { toArgs } from './toArgs';

export function composeGetter<
  T extends object,
  U1 extends (...args: any[]) => any,
>(obj: T, getter1: U1): T & ReturnType<U1>;

export function composeGetter<
  T extends object,
  U1 extends (...args: any[]) => any,
  U2 extends (...args: any[]) => any,
>(obj: T, getter1: U1, getter2: U2): T & ReturnType<U1> & ReturnType<U2>;

export function composeGetter<
  T extends object,
  U1 extends (...args: any[]) => any,
  U2 extends (...args: any[]) => any,
  U3 extends (...args: any[]) => any,
>(
  obj: T,
  getter1: U1,
  getter2: U2,
  getter3: U3,
): T & ReturnType<U1> & ReturnType<U2> & ReturnType<U3>;

export function composeGetter<
  T extends object,
  U1 extends (...args: any[]) => any,
  U2 extends (...args: any[]) => any,
  U3 extends (...args: any[]) => any,
  U4 extends (...args: any[]) => any,
>(
  obj: T,
  getter1: U1,
  getter2: U2,
  getter3: U3,
  getter4: U4,
): T & ReturnType<U1> & ReturnType<U2> & ReturnType<U3> & ReturnType<U4>;

export function composeGetter() {
  const args = toArgs<Function[]>(arguments);

  return args.reduce((carry, getter) => getter(carry), args.shift() as object);
}

export const defineGetter = (obj: object, key: string, get: () => any): any => {
  Object.defineProperty(obj, key, {
    get,
  });
  return obj;
};
