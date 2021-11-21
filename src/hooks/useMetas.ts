import assign from 'object-assign';
import { shallowEqual } from 'react-redux';
import { MetaStateItem } from '../actions/meta';
import { pickMeta, PickMeta } from '../metas/getMeta';
import { PromiseEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';
import { useCustomSelector } from './useCustomSelector';

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
  id: number | string,
): Partial<MetaStateItem>;

export function useMetas(effect: PromiseEffect): PickMeta;

export function useMetas(
  effect: PromiseEffect,
  id?: number | string,
): Partial<MetaStateItem> | PickMeta {
  const hasId = id !== void 0;

  return useCustomSelector(
    () => {
      const meta = metaManager.get(effect);

      if (hasId) {
        return pickMeta.call(meta, id);
      }

      return assign(
        {
          pick: pickMeta,
        },
        meta,
      );
    },
    hasId ? void 0 : shallowEqual,
  );
}
