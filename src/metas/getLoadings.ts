import assign from 'object-assign';
import { PickLoading, pickLoading } from '../metas/getLoading';
import { PromiseEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';

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
  id: number | string,
): boolean;

export function getLoadings(effect: PromiseEffect): PickLoading;

export function getLoadings(
  effect: PromiseEffect,
  id?: number | string,
): boolean | PickLoading {
  const meta = metaManager.get(effect);

  if (id !== void 0) {
    return pickLoading.call(meta, id);
  }

  return assign(
    {
      pick: pickLoading,
    },
    meta,
  );
}
