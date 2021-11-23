import { META_DEFAULT_CATEGORY } from '../actions/meta';
import { pickLoading } from '../metas/getLoading';
import { PromiseEffect } from '../model/EffectManager';
import { metaStore } from '../store/metaStore';
import { useMetaSelector } from './useSelector';

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
      const meta = metaStore.helper.get(args[i]);

      if (pickLoading.call(meta, META_DEFAULT_CATEGORY)) {
        return true;
      }
    }
    return false;
  });
}
