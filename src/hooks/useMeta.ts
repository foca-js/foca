import { MetaStateItem, META_DEFAULT_ID } from '../actions/meta';
import { pickMeta } from '../metas/getMeta';
import { PromiseEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';
import { useCustomSelector } from './useCustomSelector';

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = useMeta(model.effectX);
 * ```
 */
export const useMeta = (effect: PromiseEffect): Partial<MetaStateItem> => {
  return useCustomSelector(() => {
    return pickMeta.call(metaManager.get(effect), META_DEFAULT_ID);
  });
};
