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

interface AssignFunc<P extends any[] = any[], R = Promise<any>> {
  (category: number | string): {
    execute(...args: P): R;
  };
}

interface AsyncAssignEffect<P extends any[] = any[], R = Promise<any>>
  extends AssignFunc<P, R> {
  readonly _: {
    readonly model: string;
    readonly method: string;
    readonly assign: true;
  };
}

interface AsyncEffect<P extends any[] = any[], R = Promise<any>>
  extends EffectFunc<P, R> {
  readonly _: {
    readonly model: string;
    readonly method: string;
    readonly assign: '';
  };
  /**
   * 对同一effect函数的执行状态进行分类以实现独立保存。好处有：
   *
   * 1. 并发请求同一个请求时不会互相覆盖执行状态。
   * <br>
   * 2. 可以精确地判断业务中是哪个控件或者逻辑正在执行。
   *
   * ```typescript
   * model.effect.assign(CATEGORY).execute(...);
   * ```
   *
   * @see useLoading(effect.assign)
   * @see getLoading(effect.assign)
   * @see useMeta(effect.assign)
   * @see getMeta(effect.assign)
   *
   */
  readonly assign: AsyncAssignEffect<P, R>;
}

export type PromiseEffect = AsyncEffect;
export type PromiseAssignEffect = AsyncAssignEffect;

interface EffectFunc<P extends any[] = any[], R = Promise<any>> {
  (...args: P): R;
}

export type EnhancedEffect<
  P extends any[] = any[],
  R = Promise<any>,
> = R extends Promise<any> ? AsyncEffect<P, R> : EffectFunc<P, R>;

type NonReadonly<T extends object> = {
  -readonly [K in keyof T]: T[K];
};

export const enhanceEffect = <State extends object>(
  ctx: EffectCtx<State>,
  methodName: string,
  effect: (...args: any[]) => any,
): EnhancedEffect => {
  const fn: NonReadonly<EnhancedEffect> & EffectFunc = function () {
    return execute(ctx, methodName, effect, toArgs(arguments));
  };

  fn._ = {
    model: ctx.name,
    method: methodName,
    assign: '',
  };

  const assign: NonReadonly<AsyncAssignEffect> & AssignFunc = (
    category: number | string,
  ) => ({
    execute() {
      return execute(ctx, methodName, effect, toArgs(arguments), category);
    },
  });

  assign._ = Object.assign({}, fn._, {
    assign: true as const,
  });

  fn.assign = assign;

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
