import { MetaStateItem } from '../actions/meta';
import { AsyncEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';
import { useCustomSelector } from './useCustomSelector';

type PromiseEffect = AsyncEffect;

/**
 * 检测给定的effect方法的状态
 *
 * ```typescript
 * const meta = useMeta(model.effectX);
 * ```
 */
export const useMeta = (effect: PromiseEffect): Partial<MetaStateItem> => {
  const {
    _: { model, method },
  } = effect;

  return useCustomSelector(() => {
    return metaManager.get(model, method);
  });
};
