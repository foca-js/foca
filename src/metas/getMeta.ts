import { MetaStateItem, META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';
import { resolveMetaCategory } from '../utils/resolveMetaCategory';

export interface PickMeta {
  pick(category: number | string): Partial<MetaStateItem>;
}

export const pickMeta: PickMeta['pick'] = function (
  this: Record<string, Partial<MetaStateItem> | undefined>,
  category: number | string,
) {
  return this[resolveMetaCategory(category)] || {};
};

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = getMeta(model.effect1);
 * ```
 */
export const getMeta = (effect: PromiseEffect): Partial<MetaStateItem> => {
  return pickMeta.call(metaManager.get(effect), META_DEFAULT_CATEGORY);
};