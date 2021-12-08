import {
  Meta,
  MetaAction,
  MetaType,
  META_DEFAULT_CATEGORY,
} from '../actions/meta';
import type { EffectCtx } from './defineModel';
import { EffectError } from '../exceptions/EffectError';
import { isPromise } from '../utils/isPromise';
import { toArgs } from '../utils/toArgs';
import { metaStore } from '../store/metaStore';

interface AsyncEffect<P extends any[] = any[], R = Promise<any>> {
  (...args: P): R;
  readonly _: {
    readonly model: string;
    readonly method: string;
  };
  /**
   * 对同一effect函数的执行状态进行分类以实现独立保存。
   *
   * 想获得分类后的meta和loading，需要使用pick模式。
   */
  meta(category: number | string): {
    execute(...args: P): R;
  };
}

export type PromiseEffect = AsyncEffect;

interface SyncEffect<P extends any[] = any[], R = Promise<any>> {
  (...args: P): R;
}

export type EnhancedEffect<
  P extends any[] = any[],
  R = Promise<any>,
> = R extends Promise<any> ? AsyncEffect<P, R> : SyncEffect<P, R>;

type NonReadonly<T extends object> = {
  -readonly [K in keyof T]: T[K];
};

export const enhanceEffect = <State extends object>(
  ctx: EffectCtx<State>,
  methodName: string,
  effect: (...args: any[]) => any,
): EnhancedEffect => {
  const fn: NonReadonly<EnhancedEffect> & SyncEffect = function () {
    return execute(ctx, methodName, effect, toArgs(arguments));
  };

  fn.meta = (category: number | string) => ({
    execute() {
      return execute(ctx, methodName, effect, toArgs(arguments), category);
    },
  });

  fn._ = {
    model: ctx.name,
    method: methodName,
  };

  return fn;
};

const dispatchMeta = (
  modelName: string,
  methodName: string,
  type: MetaType,
  category: number | string = META_DEFAULT_CATEGORY,
  meta?: Meta,
) => {
  metaStore.dispatch<MetaAction>({
    type: modelName + '.' + methodName + ' ' + type,
    setMeta: true,
    model: modelName,
    method: methodName,
    category,
    payload: Object.assign({ type }, meta),
  });
};

const execute = <State extends object>(
  ctx: EffectCtx<State>,
  methodName: string,
  effect: (...args: any[]) => any,
  args: any[],
  category?: number | string,
) => {
  const modelName = ctx.name;
  const resultOrPromise = effect.apply(ctx, args);

  if (!isPromise(resultOrPromise)) {
    return resultOrPromise;
  }

  dispatchMeta(modelName, methodName, 'pending', category);

  return resultOrPromise
    .then((result) => {
      return dispatchMeta(modelName, methodName, 'resolved', category), result;
    })
    .catch((e: unknown) => {
      dispatchMeta(
        modelName,
        methodName,
        'rejected',
        category,
        e instanceof EffectError
          ? Object.assign({}, e.meta)
          : {
              message:
                e instanceof Error
                  ? e.message
                  : typeof e === 'string'
                  ? e
                  : void 0,
            },
      );

      throw e;
    });
};
