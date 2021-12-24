import {
  LoadingAction,
  LOADING_CATEGORY,
  TYPE_SET_LOADING,
} from '../actions/loading';
import type { EffectCtx } from './defineModel';
import { isPromise } from '../utils/isPromise';
import { toArgs } from '../utils/toArgs';
import { loadingStore } from '../store/loadingStore';
import { coroutine, isGenerator } from '../utils/coroutine';

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

interface ExtraEffectInfo<P extends any[] = any[], R = Promise<any>> {
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
   *
   */
  readonly assign: AsyncAssignEffect<P, R>;
}

interface GeneratorEffect<
  P extends any[] = any[],
  R = Generator,
  Real = R extends Generator<any, infer Return> ? Promise<Return> : never,
> extends EffectFunc<P, Real>,
    ExtraEffectInfo<P, Real> {}

interface AsyncGeneratorEffect<
  P extends any[] = any[],
  R = AsyncGenerator,
  Real = R extends AsyncGenerator<any, infer Return> ? Promise<Return> : never,
> extends EffectFunc<P, Real>,
    ExtraEffectInfo<P, Real> {}

interface AsyncEffect<P extends any[] = any[], R = Promise<any>>
  extends EffectFunc<P, R>,
    ExtraEffectInfo<P, R> {}

export type PromiseEffect =
  | AsyncEffect
  | GeneratorEffect
  | AsyncGeneratorEffect;
export type PromiseAssignEffect = AsyncAssignEffect;

interface EffectFunc<P extends any[] = any[], R = Promise<any>> {
  (...args: P): R;
}

export type EnhancedEffect<
  P extends any[] = any[],
  R = Promise<any>,
> = R extends Promise<any>
  ? AsyncEffect<P, R>
  : R extends Generator<any, any>
  ? GeneratorEffect<P, R>
  : R extends AsyncGenerator<any, any>
  ? AsyncGeneratorEffect<P, R>
  : EffectFunc<P, R>;

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

const dispatchLoading = (
  modelName: string,
  methodName: string,
  loading: boolean,
  category: number | string = LOADING_CATEGORY,
) => {
  loadingStore.dispatch<LoadingAction>({
    type: TYPE_SET_LOADING,
    model: modelName,
    method: methodName,
    payload: { category, loading },
  });
};

const execute = <State extends object>(
  ctx: EffectCtx<State>,
  methodName: string,
  effect: (...args: any[]) => any,
  args: any[],
  category?: number | string,
): any => {
  const modelName = ctx.name;
  let mixedResult: Promise<any> | Generator | AsyncGenerator = effect.apply(
    ctx,
    args,
  );

  if (!isPromise(mixedResult)) {
    if (isGenerator(mixedResult)) {
      mixedResult = coroutine.call(ctx, mixedResult);
    } else {
      return mixedResult;
    }
  }

  dispatchLoading(modelName, methodName, true, category);

  return mixedResult.then(
    (result) => {
      return dispatchLoading(modelName, methodName, false, category), result;
    },
    (e: unknown) => {
      dispatchLoading(modelName, methodName, false, category);
      throw e;
    },
  );
};
