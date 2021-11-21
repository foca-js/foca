import assign from 'object-assign';
import { MetaStateItem } from '../actions/meta';
import { pickMeta, PickMeta } from '../metas/getMeta';
import { PromiseEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';

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
  id: number | string,
): Partial<MetaStateItem>;

export function getMetas(effect: PromiseEffect): PickMeta;

export function getMetas(
  effect: PromiseEffect,
  id?: number | string,
): Partial<MetaStateItem> | PickMeta {
  const meta = metaManager.get(effect);

  if (id !== void 0) {
    return pickMeta.call(meta, id);
  }

  return assign(
    {
      pick: pickMeta,
    },
    meta,
  );
}
