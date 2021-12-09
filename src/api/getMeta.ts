import { MetaStateItem, META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseAssignEffect, PromiseEffect } from '../model/enhanceEffect';
import { metaStore, FindMeta } from '../store/metaStore';

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
 * const metas = getMeta(effect.assign)
 * const meta = metas.find(CATEGORY)
 * ```
 *
 */
export function getMeta(effect: PromiseAssignEffect): FindMeta;

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = getMeta(effect.assign, CATEGORY);
 * ```
 *
 */
export function getMeta(
  effect: PromiseAssignEffect,
  category: number | string,
): Partial<MetaStateItem>;

export function getMeta(
  effect: PromiseEffect | PromiseAssignEffect,
  category?: string | number,
): Partial<MetaStateItem> | FindMeta {
  const metas = metaStore.helper.get(effect).metas;

  if (effect._.assign) {
    return category === void 0 ? metas : metas.find(category);
  }

  return metas.find(META_DEFAULT_CATEGORY);
}
