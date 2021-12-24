import { isPromise } from './isPromise';

export const isGenerator = (obj: any): obj is Generator | AsyncGenerator => {
  return (
    obj && typeof obj.next === 'function' && typeof obj.throw === 'function'
  );
};

export function coroutine(
  this: any,
  generator: Generator | AsyncGenerator,
): Promise<any> {
  const ctx = this;

  return new Promise((resolve, reject) => {
    const onFulfilled = (result?: any) => {
      return Promise.resolve()
        .then(() => generator.next(result))
        .then(next, onRejected);
    };

    const onRejected = (err: Error) => {
      return Promise.resolve()
        .then(() => generator.throw(err))
        .then(next, reject);
    };

    const next = (result: IteratorResult<any>): any => {
      if (result.done) {
        return resolve(result.value);
      }

      return toPromise.call(ctx, result.value).then(onFulfilled);
    };

    onFulfilled();
  });
}

function toPromise(this: any, obj: any): Promise<any> {
  if (obj) {
    if (isPromise(obj)) return obj;

    if (isGenerator(obj)) {
      return coroutine.call(this, obj);
    }
  }

  return Promise.resolve(obj);
}
