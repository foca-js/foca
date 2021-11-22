import assign from 'object-assign';
import { store } from '../store/StoreAdvanced';
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

export class EffectManager<State extends object> {
  constructor(
    protected ctx: EffectCtx<State>,
    protected methodName: string,
    protected fn: (...args: any[]) => any,
    protected metaCategory: number | string = META_DEFAULT_CATEGORY,
  ) {}

  execute(args: any[]) {
    const maybePromise = this.fn.apply(this.ctx, args);

    if (!isPromise(maybePromise)) {
      return maybePromise;
    }

    this.dispatchMeta('pending');

    return maybePromise
      .then((result) => {
        return this.dispatchMeta('resolved'), result;
      })
      .catch((e: unknown) => {
        this.dispatchMeta(
          'rejected',
          e instanceof EffectError
            ? assign({}, e.meta)
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
  }

  protected dispatchMeta(type: MetaType, meta?: Meta) {
    store.dispatch<MetaAction>({
      type: this.ctx.name + '.' + this.methodName + ' ' + type,
      model: this.ctx.name,
      method: this.methodName,
      setMeta: true,
      payload: assign({ type }, meta),
      category: this.metaCategory,
    });
  }
}

interface AsyncEffect<
  State extends object = object,
  P extends any[] = any[],
  R = Promise<any>,
> {
  (...args: P): R;
  readonly _: {
    readonly model: string;
    readonly method: string;
    readonly effect: EffectManager<State>;
  };
  /**
   * 对同一effect函数的执行状态进行分类以实现独立保存。
   *
   * 想获得分类后的meta，使用方法 getMetas 或者 useMetas。
   *
   * 想获得分类后的loading，使用方法 getLoadings 或者 useLoadings。
   */
  meta(category: number | string): {
    execute(...args: P): R;
  };
}

export type PromiseEffect = AsyncEffect;

interface SyncEffect<P extends any[] = any[], R = Promise<any>> {
  (...args: P): R;
}

export type WrapEffect<
  State extends object = object,
  P extends any[] = any[],
  R = Promise<any>,
> = R extends Promise<any> ? AsyncEffect<State, P, R> : SyncEffect<P, R>;

type NonReadonly<T extends object> = {
  -readonly [K in keyof T]: T[K];
};

export const wrapEffect = <State extends object>(
  ctx: EffectCtx<State>,
  key: string,
  effect: (...args: any[]) => any,
): WrapEffect<State> => {
  const manager = new EffectManager(ctx, key, effect);
  const fn: NonReadonly<WrapEffect<State>> & SyncEffect = function () {
    return manager.execute(toArgs(arguments));
  };

  fn._ = {
    model: ctx.name,
    method: key,
    effect: manager,
  };

  fn.meta = function (category: number | string) {
    const innerManger = new EffectManager(ctx, key, effect, category);

    return {
      execute() {
        return innerManger.execute(toArgs(arguments));
      },
    };
  };

  return fn;
};
