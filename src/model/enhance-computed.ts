import { ComputedValue } from '../reactive/ComputedValue';
import { modelStore } from '../store/modelStore';
import { toArgs } from '../utils/toArgs';
import { ComputedCtx, ComputedFlag } from './types';

export const enhanceComputed = <State extends object>(
  ctx: ComputedCtx<State>,
  modelName: string,
  computedName: string,
  fn: (...args: any[]) => any,
): ComputedFlag => {
  let caches: {
    deps: any[];
    skipCount: number;
    ref: ComputedValue;
  }[] = [];

  function anonymousFn() {
    const args = toArgs(arguments);
    let hitCache: (typeof caches)[number] | undefined;

    searchCache: for (let i = 0; i < caches.length; ++i) {
      const cache = caches[i]!;
      if (hitCache) {
        ++cache.skipCount;
        continue;
      }
      for (let j = 0; j < cache.deps.length; ++j) {
        if (args[j] !== cache.deps[j]) {
          ++cache.skipCount;
          continue searchCache;
        }
      }
      cache.skipCount = 0;
      hitCache = cache;
    }

    if (hitCache) return hitCache.ref.value;

    if (caches.length > 10) {
      caches = caches.filter((cache) => cache.skipCount < 15);
    }

    hitCache = {
      deps: args,
      skipCount: 0,
      ref: new ComputedValue(modelStore, modelName, computedName, () =>
        fn.apply(ctx, args),
      ),
    };
    caches.push(hitCache);
    return hitCache.ref.value;
  }

  return anonymousFn as any;
};
