import { WrapEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';
import { useSelector } from './useSelector';

type Effect = WrapEffect;

/**
 * 检测给定的effect方法中是否有正在请求的。支持多个方法同时传入。
 *
 * ```typescript
 * loading = useLoading(model.m1);
 * loading = useLoading(model.m1, model.m2, ...);
 * ```
 *
 */
export const useLoading = (effect: Effect, ...more: Effect[]): boolean => {
  return useSelector(() => {
    return more.concat(effect).some((wrapper) => {
      return (
        wrapper &&
        wrapper.$$ &&
        wrapper.$$.model &&
        wrapper.$$.method &&
        metaManager.getMeta(wrapper.$$.model, wrapper.$$.method).loading
      );
    });
  });
};
