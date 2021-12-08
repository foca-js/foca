import { META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/enhanceEffect';
import { metaStore, PickLoading } from '../store/metaStore';

const helper = metaStore.helper;

/**
 * 检测给定的effect方法中是否有正在执行的。支持多个方法同时传入。
 *
 * ```typescript
 * loading = getLoading(effect);
 * loading = getLoading(effect1, effect2, ...);
 * ```
 *
 */
export function getLoading(
  effect: PromiseEffect,
  ...more: PromiseEffect[]
): boolean;

/**
 * 检测给定的effect方法是否正在执行。
 *
 * ```typescript
 * loadings = getLoading(effect, 'pick');
 * loading = loadings.pick(CATEGORY)
 * ```
 */
export function getLoading(
  effect: PromiseEffect,
  pickLoading: 'pick',
): PickLoading;

/**
 * 检测给定的effect方法是否正在执行。
 *
 * ```typescript
 * loading = getLoading(effect, 'pick', CATEGORY);
 * ```
 */
export function getLoading(
  effect: PromiseEffect,
  pick: 'pick',
  category: string | number,
): boolean;

export function getLoading(): boolean | PickLoading {
  const args = arguments;

  if (args[1] === 'pick') {
    const loadings = helper.get(args[0]).loadings;
    return args.length === 2 ? loadings : loadings.pick(args[2]);
  }

  for (let i = 0; i < args.length; ++i) {
    if (helper.get(args[i]).loadings.pick(META_DEFAULT_CATEGORY)) {
      return true;
    }
  }
  return false;
}
