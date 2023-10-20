import { OBJECT } from './is-type';

export const deepEqual = (a: any, b: any): boolean => {
  if (a === b) return true;

  if (a && b && typeof a == OBJECT && typeof b == OBJECT) {
    if (a.constructor !== b.constructor) return false;

    let i: number;
    let len: number;
    let key: string;

    if (Array.isArray(a)) {
      len = a.length;

      if (len != b.length) return false;

      for (i = len; i-- > 0; ) {
        if (!deepEqual(a[i], b[i])) return false;
      }

      return true;
    }

    const keys = Object.keys(a);
    len = keys.length;

    if (len !== Object.keys(b).length) return false;

    for (i = len; i-- > 0; ) {
      if (!hasOwn.call(b, keys[i]!)) return false;
    }

    for (i = len; i-- > 0; ) {
      key = keys[i]!;
      if (!deepEqual(a[key], b[key])) return false;
    }

    return true;
  }

  return a !== a && b !== b;
};

const hasOwn = Object.prototype.hasOwnProperty;
