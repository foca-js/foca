import { MetaStateItem } from '../actions/meta';
import { PromiseAssignEffect, PromiseEffect } from '../model/enhanceEffect';
import { FindMeta } from '../store/metaStore';
import { useMetaSelector } from '../redux/useSelector';
import { getMeta } from './getMeta';

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = useMeta(effect);
 * ```
 */
export function useMeta(effect: PromiseEffect): Partial<MetaStateItem>;

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const metas = useMeta(effect.assign)
 * const meta = metas.find(CATEGORY);
 * ```
 *
 */
export function useMeta(effect: PromiseAssignEffect): FindMeta;

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = useMeta(effect.assign, CATEGORY)
 * ```
 *
 */
export function useMeta(
  effect: PromiseAssignEffect,
  category: number | string,
): Partial<MetaStateItem>;

export function useMeta(): Partial<MetaStateItem> | FindMeta {
  const args = arguments as unknown as Parameters<typeof getMeta>;

  return useMetaSelector(() => {
    return getMeta.apply(null, args);
  });
}
