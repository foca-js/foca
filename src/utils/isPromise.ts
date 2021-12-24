export const isPromise = <T>(value: any): value is Promise<T> => {
  return (
    value instanceof Promise ||
    (value !== null &&
      (typeof value === 'object' || typeof value === 'function') &&
      typeof value.then === 'function')
  );
};
