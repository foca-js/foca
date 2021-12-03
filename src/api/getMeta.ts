import { MetaStateItem, META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/enhanceEffect';
import { metaStore, PickMeta } from '../store/metaStore';

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = getMeta(model.effect1);
 * ```
 */
export const getMeta = (effect: PromiseEffect): Partial<MetaStateItem> => {
  return metaStore.helper.get(effect).metas.pick(META_DEFAULT_CATEGORY);
};

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * meta = getMetas(model.effectX, id);
 * metas = getMetas(model.effectX).pick(id)
 * ```
 *
 */
export function getMetas(
  effect: PromiseEffect,
  category: number | string,
): Partial<MetaStateItem>;

export function getMetas(effect: PromiseEffect): PickMeta;

export function getMetas(
  effect: PromiseEffect,
  category?: number | string,
): Partial<MetaStateItem> | PickMeta {
  const metas = metaStore.helper.get(effect).metas;
  return category === void 0 ? metas : metas.pick(category);
}
