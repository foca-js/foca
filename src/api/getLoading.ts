import { META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/enhanceEffect';
import { metaStore, PickLoading } from '../store/metaStore';

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
    if (
      metaStore.helper.get(arguments[i]).loadings.pick(META_DEFAULT_CATEGORY)
    ) {
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
  const loadings = metaStore.helper.get(effect).loadings;

  return category === void 0 ? loadings : loadings.pick(category);
}
