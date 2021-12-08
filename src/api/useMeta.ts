import { MetaStateItem } from '../actions/meta';
import { PromiseEffect } from '../model/enhanceEffect';
import { PickMeta } from '../store/metaStore';
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
 * const metas = useMeta(effect, 'pick')
 * const meta = metas.pick(CATEGORY);
 * ```
 *
 */
export function useMeta(effect: PromiseEffect, pickMeta: 'pick'): PickMeta;

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = useMeta(effect, 'pick', CATEGORY)
 * ```
 *
 */
export function useMeta(
  effect: PromiseEffect,
  pick: 'pick',
  category: number | string,
): Partial<MetaStateItem>;

export function useMeta(): Partial<MetaStateItem> | PickMeta {
  const args = arguments as unknown as Parameters<typeof getMeta>;

  return useMetaSelector(() => {
    return getMeta.apply(null, args);
  });
}
