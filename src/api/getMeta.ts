import assign from 'object-assign';
import { MetaStateItem, META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/enhanceEffect';
import { metaStore } from '../store/metaStore';
import { metaKey } from '../utils/metaKey';

export interface PickMeta {
  pick(category: number | string): Partial<MetaStateItem>;
}

export const pickMeta: PickMeta['pick'] = function (
  this: Record<string, Partial<MetaStateItem> | undefined>,
  category: number | string,
) {
  return this[metaKey(category)] || {};
};

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = getMeta(model.effect1);
 * ```
 */
export const getMeta = (effect: PromiseEffect): Partial<MetaStateItem> => {
  return pickMeta.call(metaStore.helper.get(effect), META_DEFAULT_CATEGORY);
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
  const meta = metaStore.helper.get(effect);

  return category === void 0
    ? assign(
        {
          pick: pickMeta,
        },
        meta,
      )
    : pickMeta.call(meta, category);
}
