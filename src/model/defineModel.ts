import { AnyAction } from 'redux';
import cloneDeep from 'clone';
import assign from 'object-assign';
import { DispatchAction, WrapAction, wrapAction } from './ActionManager';
import { WrapEffect, wrapEffect } from './EffectManager';
import { store, StoreAdvanced } from '../store/StoreAdvanced';
import { ReducerManager } from '../reducers/ReducerManager';

export interface GetName<Name extends string> {
  /**
   * 模型名称。请在定义模型时确保是唯一的字符串
   */
  readonly name: Name;
}

export interface GetState<State> {
  /**
   * 模型的实时状态
   */
  readonly state: State;
}

export interface GetInitialState<State> {
  /**
   * 模型的初始状态（每次深拷贝）
   */
  readonly initialState: State;
}

export interface SetState<State extends object> {
  /**
   * 立即更改状态，支持**immer**操作
   *
   * ```typescript
   * this.dispatch((state) => {
   *   state.count += 1;
   * });
   * ```
   */
  dispatch(fn: (state: State) => State | void): AnyAction;
}

export interface ActionCtx<State extends object> extends GetName<string>, GetInitialState<State> {}

export interface EffectCtx<State extends object>
  extends SetState<State>,
    GetState<State>,
    ActionCtx<State> {}

export interface BaseModel<Name extends string, State extends object>
  extends GetState<State>,
    GetName<Name> {}

type ModelAction<State extends object, Action extends object> = {
  readonly [K in keyof Action]: Action[K] extends (state: State, ...args: infer P) => State | void
    ? (...args: P) => DispatchAction<State, P[0]>
    : never;
};

type ModelEffect<State extends object, Effect extends object> = {
  readonly [K in keyof Effect]: Effect[K] extends (...args: infer P) => infer R
    ? WrapEffect<State, P, R>
    : never;
};

export type Model<
  Name extends string,
  State extends object,
  Action extends object,
  Effect extends object,
> = BaseModel<Name, State> & ModelAction<State, Action> & ModelEffect<State, Effect>;

export type InternalModel<
  Name extends string,
  State extends object,
  Action extends object,
  Effect extends object,
> = BaseModel<Name, State> & {
  _$opts: DefineModelOptions<State, Action, Effect>;
};

export type InternalAction<State extends object> = {
  [key: string]: (state: State, ...args: any[]) => State | void;
};

export interface DefineModelOptions<
  State extends object,
  Action extends object,
  Effect extends object,
> {
  /**
   * 初始状态
   *
   * ```typescript
   * interface State {
   *   count: number;
   * }
   *
   * const model = defineModel('model1', {
   *   state: <State>{
   *     count: 0,
   *   }
   * });
   * ```
   */
  state: State;
  /**
   * 定义修改状态的方法。参数一自动推断为state类型。支持**immer**操作。支持多参数。
   *
   * ```typescript
   * const model = defineModel('model1', {
   *   state: <{ count: 0 }>{
   *     count: 0,
   *   },
   *   actions: {
   *     plus(state, step: number) {
   *       state.count += step;
   *     },
   *     minus(state, step: number, scale: 1 | 2) {
   *       state.count -= step * scale;
   *     }
   *   },
   * });
   * ```
   */
  actions?: Action & InternalAction<State> & ThisType<ActionCtx<State>>;
  /**
   * 定义普通方法，异步方法等。
   * 调用effect方法时，一般会伴随异步操作（请求数据、耗时任务），框架会自动收集当前方法的调用状态。
   *
   * ```typescript
   * const model = defineModel('model1', {
   *   state: {},
   *   effects: {
   *     async foo(p1: string, p2: number) {
   *       await Promise.resolve();
   *       return 'OK';
   *     }
   *   },
   * });
   *
   * useMeta(model.foo); // TYPE: undefined | { loading: boolean; message?: string }
   * useLoading(model.foo); // TYPE: boolean
   * ```
   */
  effects?: Effect & ThisType<ModelAction<State, Action> & Effect & EffectCtx<State>>;
  /**
   * 清空仓库所有数据时，是否保留该模型的数据，默认：false
   *
   * @see store.refresh()
   */
  keepStateFromRefresh?: boolean;
  /**
   * 定制持久化，请确保已经在初始化store的时候加入了当前模型，否则当前设置无效
   *
   * @see store.init()
   */
  persist?: {
    /**
     * 持久化版本号，数据结构变化后建议立即升级该版本
     */
    version?: number | string;
    /**
     * 持久化数据活跃时间，单位（秒）
     */
    ttl?: number;
    /**
     * 持久化数据恢复到模型时的过滤函数，此时可修改数据以满足业务需求。
     *
     * 支持**immer**操作。
     */
    decode?: (persist: State) => State | void;
  };
}

const noop = () => {};

export const defineModel = <
  Name extends string,
  State extends object,
  Action extends object,
  Effect extends object,
>(
  name: Name,
  options: DefineModelOptions<State, Action, Effect>,
): Model<Name, State, Action, Effect> => {
  const { state, actions, effects, keepStateFromRefresh } = options;

  const ctx: EffectCtx<State> = {
    name,
    get state() {
      return store.getState()[name] as State;
    },
    get initialState() {
      return cloneDeep(state);
    },
    // @ts-expect-error
    dispatch: noop,
  };

  const anonymousAction = wrapAction(
    ctx,
    'anonymous',
    (state: State, fn: (state: State) => State | void) => fn(state),
  );

  ctx.dispatch = (fn: (state: State) => State | void) => anonymousAction(fn);

  const transformedActions: Record<string, WrapAction<State>> = {};
  if (actions) {
    const keys = Object.keys(actions);
    for (let i = 0; i < keys.length; ++i) {
      const actionName = keys[i]!;
      transformedActions[actionName] = wrapAction(ctx, actionName, actions[actionName]!);
    }
  }

  const transformedEffects: Record<string, WrapEffect<State>> = {};
  if (effects) {
    const keys = Object.keys(effects);
    for (let i = 0; i < keys.length; ++i) {
      const effectName = keys[i]!;
      // @ts-expect-error
      const effect = effects[effectName];
      transformedEffects[effectName] = wrapEffect(ctx, effectName, effect);
    }
  }

  // 使用扩展操作符会直接触发getter
  const model: InternalModel<Name, State, Action, Effect> = assign(
    {
      get state() {
        return ctx.state;
      },
      get name() {
        return name;
      },
      get _$opts() {
        return options;
      },
    },
    transformedActions,
    transformedEffects,
  );

  assign(ctx, transformedActions, transformedEffects);

  const reducer = new ReducerManager({
    name: name,
    initial: state,
    keepStateFromRefresh: !!keepStateFromRefresh,
  });

  StoreAdvanced.appendReducer(reducer);

  return model as unknown as Model<Name, State, Action, Effect>;
};
