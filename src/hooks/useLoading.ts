import { AsyncEffect } from '../model/EffectManager';
import { metaManager } from '../reducers/MetaManger';
import { useCustomSelector } from './useCustomSelector';

type PromiseEffect = AsyncEffect;

/**
 * 检测给定的effect方法中是否有正在请求的。支持多个方法同时传入。
 *
 * ```typescript
 * loading = useLoading(model.m1);
 * loading = useLoading(model.m1, model.m2, ...);
 * ```
 *
 */
export const useLoading = (
  effect: PromiseEffect,
  ...more: PromiseEffect[]
): boolean => {
  return useCustomSelector(() => {
    return more.concat(effect).some((wrapper) => {
      return (
        wrapper &&
        wrapper._ &&
        metaManager.getMeta(wrapper._.model, wrapper._.method).loading
      );
    });
  });
};
