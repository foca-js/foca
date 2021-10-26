import { useSelector } from 'react-redux';
import { WrapEffect } from '../model/EffectManager';
import { metaManager, MetaStateItem } from '../reducers/MetaManger';

type Effect = WrapEffect;

/**
 * 检测给定的effect方法的状态
 *
 * ```typescript
 * const meta = useMeta(model.m1);
 * ```
 */
export const useMeta = (effect: Effect): Partial<MetaStateItem> => {
  return useSelector(() => {
    return effect && effect.$$ && effect.$$.model && effect.$$.method
      ? metaManager.getMeta(effect.$$.model, effect.$$.method)
      : {};
  });
};
