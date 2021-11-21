import assign from 'object-assign';
import { shallowEqual } from 'react-redux';
import { PickLoading, pickLoading } from '../metas/getLoading';
import { PromiseEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';
import { useCustomSelector } from './useCustomSelector';

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
  id: number | string,
): boolean;

export function useLoadings(effect: PromiseEffect): PickLoading;

export function useLoadings(
  effect: PromiseEffect,
  id?: number | string,
): boolean | PickLoading {
  const hasId = id !== void 0;

  return useCustomSelector(
    () => {
      const meta = metaManager.get(effect);

      if (hasId) {
        return pickLoading.call(meta, id);
      }

      return assign(
        {
          pick: pickLoading,
        },
        meta,
      );
    },
    hasId ? void 0 : shallowEqual,
  );
}
