import { PromiseAssignEffect, PromiseEffect } from '../model/enhanceEffect';
import { FindLoading } from '../store/metaStore';
import { useMetaSelector } from '../redux/useSelector';
import { getLoading } from './getLoading';

/**
 * 检测给定的effect方法中是否有正在执行的。支持多个方法同时传入。
 *
 * ```typescript
 * loading = useLoading(effect);
 * loading = useLoading(effect1, effect2, ...);
 * ```
 *
 */
export function useLoading(
  effect: PromiseEffect,
  ...more: PromiseEffect[]
): boolean;

/**
 * 检测给定的effect方法是否正在执行。
 *
 * ```typescript
 * loadings = useLoading(effect.assign);
 * loading = loadings.find(CATEGORY)
 * ```
 */
export function useLoading(effect: PromiseAssignEffect): FindLoading;

/**
 * 检测给定的effect方法是否正在执行。
 *
 * ```typescript
 * loading = useLoading(effect.assign, CATEGORY);
 * ```
 */
export function useLoading(
  effect: PromiseAssignEffect,
  category: string | number,
): boolean;

export function useLoading(): boolean | FindLoading {
  const args = arguments as unknown as Parameters<typeof getLoading>;

  return useMetaSelector(() => {
    return getLoading.apply(null, args);
  });
}
