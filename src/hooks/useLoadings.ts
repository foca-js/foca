import assign from 'object-assign';
import { shallowEqual } from 'react-redux';
import { PickLoading, pickLoading } from '../metas/getLoading';
import { PromiseEffect } from '../model/EffectManager';
import { metaManager } from '../store/metaStore';
import { useMetaSelector } from './useSelector';

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
  const noPick = category !== void 0;

  return useMetaSelector(
    () => {
      const meta = metaManager.get(effect);

      if (noPick) {
        return pickLoading.call(meta, category);
      }

      return assign(
        {
          pick: pickLoading,
        },
        meta,
      );
    },
    noPick ? void 0 : shallowEqual,
  );
}
