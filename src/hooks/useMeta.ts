import { MetaStateItem, META_DEFAULT_CATEGORY } from '../actions/meta';
import { pickMeta } from '../metas/getMeta';
import { PromiseEffect } from '../model/EffectManager';
import { metaManager } from '../store/metaStore';
import { useMetaSelector } from './useSelector';

/**
 * 获取给定的effect方法的执行状态。
 *
 * ```typescript
 * const meta = useMeta(model.effectX);
 * ```
 */
export const useMeta = (effect: PromiseEffect): Partial<MetaStateItem> => {
  return useMetaSelector(() => {
    return pickMeta.call(metaManager.get(effect), META_DEFAULT_CATEGORY);
  });
};
