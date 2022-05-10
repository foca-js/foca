import { PromiseRoomEffect, PromiseEffect } from '../model/enhanceEffect';
import { FindLoading } from '../store/loadingStore';
import { useLoadingSelector } from '../redux/useSelector';
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
 * loadings = useLoading(effect.room);
 * loading = loadings.find(CATEGORY);
 * ```
 */
export function useLoading(effect: PromiseRoomEffect): FindLoading;

/**
 * 检测给定的effect方法是否正在执行。
 *
 * ```typescript
 * loading = useLoading(effect.room, CATEGORY);
 * ```
 */
export function useLoading(
  effect: PromiseRoomEffect,
  category: string | number,
): boolean;

export function useLoading(): boolean | FindLoading {
  const args = arguments as unknown as Parameters<typeof getLoading>;

  return useLoadingSelector(() => {
    return getLoading.apply(null, args);
  });
}
