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
export function useLoading(
  effect: PromiseEffect,
  ...more: PromiseEffect[]
): boolean;

export function useLoading(): boolean {
  return useCustomSelector(() => {
    for (let i = 0; i < arguments.length; ++i) {
      const {
        _: { model, method },
      }: PromiseEffect = arguments[i];

      // 初次执行时，必定是没有正在run的effect，所以可以全部循环到并激活meta
      if (metaManager.get(model, method).type === 'pending') {
        return true;
      }
    }
    return false;
  });
}
