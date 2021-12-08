import { PromiseEffect } from '../model/enhanceEffect';
import { PickLoading } from '../store/metaStore';
import { useMetaSelector } from '../redux/useSelector';
import { getLoading } from '..';

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
 * loadings = useLoading(effect, 'pick');
 * loading = loadings.pick(CATEGORY)
 * ```
 */
export function useLoading(
  effect: PromiseEffect,
  pickLoading: 'pick',
): PickLoading;

/**
 * 检测给定的effect方法是否正在执行。
 *
 * ```typescript
 * loading = useLoading(effect, 'pick', CATEGORY);
 * ```
 */
export function useLoading(
  effect: PromiseEffect,
  pick: 'pick',
  category: string | number,
): boolean;

export function useLoading(): boolean | PickLoading {
  const args = arguments as unknown as Parameters<typeof getLoading>;

  return useMetaSelector(() => {
    return getLoading.apply(null, args);
  });
}
