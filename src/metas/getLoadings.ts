import assign from 'object-assign';
import { PickLoading, pickLoading } from '../metas/getLoading';
import { PromiseEffect } from '../model/EffectManager';
import { metaStore } from '../store/metaStore';

/**
 * 检测给定的effect方法中是否正在执行。
 *
 * ```typescript
 * loading = getLoadings(model.effectX, id);
 * loadings = getLoadings(model.effectX).pick(id)
 * ```
 *
 */
export function getLoadings(
  effect: PromiseEffect,
  category: number | string,
): boolean;

export function getLoadings(effect: PromiseEffect): PickLoading;

export function getLoadings(
  effect: PromiseEffect,
  category?: number | string,
): boolean | PickLoading {
  const meta = metaStore.helper.get(effect);

  if (category !== void 0) {
    return pickLoading.call(meta, category);
  }

  return assign(
    {
      pick: pickLoading,
    },
    meta,
  );
}
