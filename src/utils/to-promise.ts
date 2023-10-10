export const toPromise = <T>(fn: () => T | Promise<T>): Promise<T> => {
  return Promise.resolve().then(fn);
};
