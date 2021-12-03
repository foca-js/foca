import { META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/enhanceEffect';
import { metaStore, PickLoading } from '../store/metaStore';
import { useMetaSelector } from '../redux/useSelector';

/**
 * 检测给定的effect方法中是否有正在执行的。支持多个方法同时传入。
 *
 * ```typescript
 * loading = useLoading(model.m1);
 * loading = useLoading(model.m1, model.m2, ...);
 * ```
 *
 */
export function useLoading(
  effect: PromiseEffect,
  ...more: PromiseEffect[]
): boolean;

export function useLoading(): boolean {
  const args = arguments;

  return useMetaSelector(() => {
    for (let i = 0; i < args.length; ++i) {
      if (metaStore.helper.get(args[i]).loadings.pick(META_DEFAULT_CATEGORY)) {
        return true;
      }
    }
    return false;
  });
}

/**
 * 检测给定的effect方法中是否正在执行。
 *
 * ```typescript
 * loading = useLoadings(model.effectX, id);
 * loadings = useLoadings(model.effectX).pick(id)
 * ```
 *
 */
export function useLoadings(
  effect: PromiseEffect,
  category: number | string,
): boolean;

export function useLoadings(effect: PromiseEffect): PickLoading;

export function useLoadings(
  effect: PromiseEffect,
  category?: number | string,
): boolean | PickLoading {
  return useMetaSelector(() => {
    const loadings = metaStore.helper.get(effect).loadings;
    return category === void 0 ? loadings : loadings.pick(category);
  });
}
