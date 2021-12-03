import { MetaStateItem, META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/enhanceEffect';
import { metaStore, PickMeta } from '../store/metaStore';
import { useMetaSelector } from '../redux/useSelector';

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = useMeta(model.effectX);
 * ```
 */
export const useMeta = (effect: PromiseEffect): Partial<MetaStateItem> => {
  return useMetaSelector(() => {
    return metaStore.helper.get(effect).metas.pick(META_DEFAULT_CATEGORY);
  });
};

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * meta = useMetas(model.effectX, id);
 * metas = useMetas(model.effectX).pick(id)
 * ```
 *
 */
export function useMetas(
  effect: PromiseEffect,
  category: number | string,
): Partial<MetaStateItem>;

export function useMetas(effect: PromiseEffect): PickMeta;

export function useMetas(
  effect: PromiseEffect,
  category?: number | string,
): Partial<MetaStateItem> | PickMeta {
  return useMetaSelector(() => {
    const metas = metaStore.helper.get(effect).metas;
    return category === void 0 ? metas : metas.pick(category);
  });
}
