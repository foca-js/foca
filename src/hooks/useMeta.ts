import { MetaStateItem } from '../actions/meta';
import { AsyncEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';
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
    return effect && effect._
      ? metaManager.getMeta(effect._.model, effect._.method)
      : {};
  });
};
