import { MetaStateItem, META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';
import { resolveMetaCategory } from '../utils/resolveMetaCategory';

export interface PickLoading {
  pick(category: number | string): boolean;
}

export const pickLoading: PickLoading['pick'] = function (
  this: Record<string, Partial<MetaStateItem> | undefined>,
  category: number | string,
) {
  return (this[resolveMetaCategory(category)] || {}).type === 'pending';
};

/**
 * 检测给定的effect方法中是否有正在执行的。支持多个方法同时传入。
 *
 * ```typescript
 * loading = getLoading(model.effect1);
 * loading = getLoading(model.effect1, model.effect2, ...);
 * ```
 *
 */
export function getLoading(
  effect: PromiseEffect,
  ...more: PromiseEffect[]
): boolean;

export function getLoading(): boolean {
  for (let i = 0; i < arguments.length; ++i) {
    const meta = metaManager.get(arguments[i]);

    if (pickLoading.call(meta, META_DEFAULT_CATEGORY)) {
      return true;
    }
  }
  return false;
}
