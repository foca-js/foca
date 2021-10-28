import { AsyncEffect } from '../model/EffectManager';
import { metaManager, MetaStateItem } from '../reducers/MetaManger';
import { useCustomSelector } from './useCustomSelector';

type PromiseEffect = AsyncEffect;

/**
 * 检测给定的effect方法的状态
 *
 * ```typescript
 * const meta = useMeta(model.m1);
 * ```
 */
export const useMeta = (effect: PromiseEffect): Partial<MetaStateItem> => {
  return useCustomSelector(() => {
    return effect && effect.$$ && effect.$$.model && effect.$$.method
      ? metaManager.getMeta(effect.$$.model, effect.$$.method)
      : {};
  });
};
