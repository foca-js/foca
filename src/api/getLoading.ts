import assign from 'object-assign';
import { MetaStateItem, META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/enhanceEffect';
import { metaStore } from '../store/metaStore';
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
    const meta = metaStore.helper.get(arguments[i]);

    if (pickLoading.call(meta, META_DEFAULT_CATEGORY)) {
      return true;
    }
  }
  return false;
}

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
