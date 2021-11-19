import assign from 'object-assign';
import { store } from '../store/StoreAdvanced';
import { Meta, MetaAction, MetaStateItem } from '../actions/meta';
import type { EffectCtx } from './defineModel';
import { EffectError } from '../exceptions/EffectError';
import { metaManager } from '../reducers/MetaManger';
import { isPromise } from '../utils/isPromise';
import { getArgs } from '../utils/getArgs';

export class EffectManager<State extends object> {
  constructor(
    protected ctx: EffectCtx<State>,
    protected methodName: string,
    protected fn: (...args: any[]) => any,
  ) {}

  execute(args: any[]) {
    const mayBePromise = this.fn.apply(this.ctx, args);

    if (!isPromise(mayBePromise)) {
      return mayBePromise;
    }

    this.dispatchMeta('-', true);

    return mayBePromise
      .then((result) => {
        this.dispatchMeta('ok', false);
        return result;
      })
      .catch((e: unknown) => {
        this.dispatchMeta(
          'failed',
          false,
          e instanceof EffectError
            ? e.meta
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

  protected dispatchMeta(
    status: '-' | 'ok' | 'failed',
    loading: boolean,
    meta?: Meta,
  ) {
    store.dispatch<MetaAction>({
      type: this.ctx.name + '.' + this.methodName + ' ' + status,
      model: this.ctx.name,
      method: this.methodName,
      setMeta: true,
      payload: assign({ loading }, meta),
    });
  }
}

export interface AsyncEffect<
  State extends object = object,
  P extends any[] = any[],
  R = Promise<any>,
> {
  (...args: P): R;
  readonly loading: boolean;
  readonly meta: Partial<MetaStateItem>;
  readonly _: {
    readonly model: string;
    readonly method: string;
    readonly effect: EffectManager<State>;
  };
}

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
    return manager.execute.call(manager, getArgs(arguments));
  };

  fn.meta = {};
  fn.loading = false;
  fn._ = {
    model: ctx.name,
    method: key,
    effect: manager,
  };

  Object.defineProperties(fn, {
    meta: {
      get() {
        return metaManager.get(ctx.name, key);
      },
    },
    loading: {
      get() {
        return !!fn.meta.loading;
      },
    },
  });

  return fn;
};
