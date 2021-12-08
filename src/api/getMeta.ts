import { MetaStateItem, META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/enhanceEffect';
import { metaStore, PickMeta } from '../store/metaStore';

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = getMeta(effect);
 * ```
 */
export function getMeta(effect: PromiseEffect): Partial<MetaStateItem>;

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const metas = getMeta(effect, 'pick')
 * const meta = metas.pick(CATEGORY)
 * ```
 *
 */
export function getMeta(effect: PromiseEffect, pickMeta: 'pick'): PickMeta;

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = getMeta(effect, 'pick', CATEGORY);
 * ```
 *
 */
export function getMeta(
  effect: PromiseEffect,
  pick: 'pick',
  category: number | string,
): Partial<MetaStateItem>;

export function getMeta(
  effect: PromiseEffect,
  pick?: 'pick',
  category?: string | number,
): Partial<MetaStateItem> | PickMeta {
  const metas = metaStore.helper.get(effect).metas;

  if (pick === 'pick') {
    return category === void 0 ? metas : metas.pick(category);
  }

  return metas.pick(META_DEFAULT_CATEGORY);
}
