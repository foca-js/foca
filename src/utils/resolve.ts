export const resolve = <T>(fn: () => T | Promise<T>): Promise<T> => {
  return Promise.resolve().then(fn);
};
