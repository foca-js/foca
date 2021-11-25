import assign from 'object-assign';
import { shallowEqual } from 'react-redux';
import { pickMeta, PickMeta } from './getMeta';
import { MetaStateItem, META_DEFAULT_CATEGORY } from '../actions/meta';
import { PromiseEffect } from '../model/enhanceEffect';
import { metaStore } from '../store/metaStore';
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
    return pickMeta.call(metaStore.helper.get(effect), META_DEFAULT_CATEGORY);
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
  const noPick = category !== void 0;

  return useMetaSelector(
    () => {
      const meta = metaStore.helper.get(effect);

      if (noPick) {
        return pickMeta.call(meta, category);
      }

      return assign(
        {
          pick: pickMeta,
        },
        meta,
      );
    },
    noPick ? void 0 : shallowEqual,
  );
}
