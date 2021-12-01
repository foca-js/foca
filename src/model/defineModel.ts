import { AnyAction } from 'redux';
import cloneDeep from 'clone';
import { EnhancedAction, enhanceAction } from './enhanceAction';
import { EnhancedEffect, enhanceEffect } from './enhanceEffect';
import { modelStore } from '../store/modelStore';
import { createReducer } from '../redux/createReducer';

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
   * 模型的初始状态，每次获取该属性都会执行深拷贝操作
   */
  readonly initialState: State;
}

export interface ModelPersist<State extends object> {
  /**
   * 持久化版本号，数据结构变化后建议立即升级该版本。默认值：0
   */
  version?: number | string;
  /**
   * 持久化数据活跃时间（ms)，默认：Infinity
   */
  maxAge?: number;
  /**
   * 持久化数据恢复到模型时的过滤函数，此时可修改数据以满足业务需求。
   *
   */
  decode?: (this: void, persist: State) => State | void;
}

export interface ActionCtx<State extends object>
  extends GetName<string>,
    GetInitialState<State> {}

export interface EffectCtx<State extends object>
  extends ActionCtx<State>,
    GetState<State> {
  /**
   * 立即更改状态，支持**immer**操作
   *
   * ```typescript
   * this.dispatch((state) => {
   *   state.count += 1;
   * });
   * ```
   *
   * 如果你是要替换**全部状态**，可以直接传给dispatch
   *
   * ```typescript
   * this.dispatch({
   *   count: 10,
   * });
   * ```
   */
  dispatch(state: State): AnyAction;
  dispatch(fn: (state: State) => State | void): AnyAction;
}

export interface BaseModel<Name extends string, State extends object>
  extends GetState<State>,
    GetName<Name> {}

type ModelAction<State extends object, Action extends object> = {
  readonly [K in keyof Action]: Action[K] extends (
    state: State,
    ...args: infer P
  ) => State | void
    ? (...args: P) => AnyAction
    : never;
};

type ModelEffect<Effect extends object> = {
  readonly [K in keyof Effect]: Effect[K] extends (...args: infer P) => infer R
    ? EnhancedEffect<P, R>
    : never;
};

export type Model<
  Name extends string = string,
  State extends object = object,
  Action extends object = object,
  Effect extends object = object,
> = BaseModel<Name, State> & ModelAction<State, Action> & ModelEffect<Effect>;

export type InternalModel<
  Name extends string = string,
  State extends object = object,
  Action extends object = object,
  Effect extends object = object,
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
   * cosnt initialState: {
   *   count: number;
   * } = {
   *   count: 0,
   * }
   *
   * const model = defineModel('model1', {
   *   initialState
   * });
   * ```
   */
  initialState: State;
  /**
   * 定义修改状态的方法。参数一自动推断为state类型。支持**immer**操作。支持多参数。
   *
   * ```typescript
   * const model = defineModel('model1', {
   *   initialState,
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
   *   initialState,
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
  effects?: Effect &
    ThisType<ModelAction<State, Action> & Effect & EffectCtx<State>>;
  /**
   * 是否阻止刷新数据时跳过当前模型，默认即不跳过。
   *
   * 如果是强制刷新，则该参数无效。
   *
   * @see store.refresh(force: boolean = false)
   */
  skipRefresh?: boolean;
  /**
   * 定制持久化，请确保已经在初始化store的时候把当前模型加入persist配置，否则当前设置无效
   *
   * @see store.init()
   */
  persist?: ModelPersist<State>;
}

export const defineModel = <
  Name extends string,
  State extends object,
  Action extends object,
  Effect extends object,
>(
  name: Name,
  options: DefineModelOptions<State, Action, Effect>,
): Model<Name, State, Action, Effect> => {
  const { initialState, actions, effects, skipRefresh } = options;

  const getState = (): State => modelStore.getState()[name];
  const getInitialState = (): State => cloneDeep(initialState);

  const actionCtx: ActionCtx<State> = {
    get name() {
      return name;
    },
    get initialState() {
      return getInitialState();
    },
  };

  const createEffectCtx = (methodName: string): EffectCtx<State> => {
    const ctx: EffectCtx<State> = {
      get name() {
        return name;
      },
      get initialState() {
        return getInitialState();
      },
      get state() {
        return getState();
      },
      dispatch: enhanceAction(
        actionCtx,
        `dispatch [${methodName}]`,
        anonymousConsumer,
      ),
    };

    return ctx;
  };

  const enhancedActions: Record<string, EnhancedAction<State>> = {};
  actions &&
    Object.keys(actions).forEach((actionName) => {
      enhancedActions[actionName] = enhanceAction(
        actionCtx,
        actionName,
        actions[actionName]!,
      );
    });

  const enhancedEffects: Record<string, EnhancedEffect> = {};
  if (effects) {
    const effectCtxs: EffectCtx<State>[] = [createEffectCtx('')];

    Object.keys(effects).forEach((effectName) => {
      process.env.NODE_ENV !== 'production' &&
        effectCtxs.push(createEffectCtx(effectName));
      enhancedEffects[effectName] = enhanceEffect(
        effectCtxs[effectCtxs.length - 1]!,
        effectName,
        // @ts-expect-error
        effects[effectName],
      );
    });

    effectCtxs.forEach((ctx) => {
      Object.assign(ctx, enhancedActions, enhancedEffects);
    });
  }

  // 使用扩展操作符(rest/spread)会直接触发getter
  const model: InternalModel<Name, State, Action, Effect> = Object.assign(
    {
      get state() {
        return getState();
      },
      get name() {
        return name;
      },
      get _$opts() {
        return options;
      },
    },
    enhancedActions,
    enhancedEffects,
  );

  const reducer = createReducer({
    name,
    initialState: getInitialState(),
    allowRefresh: !skipRefresh,
  });

  modelStore.appendReducer(name, reducer);

  return model as any;
};

const anonymousConsumer = <State extends object>(
  state: State,
  fn_or_state: State | ((state: State) => State | void),
) => {
  return typeof fn_or_state === 'function' ? fn_or_state(state) : fn_or_state;
};
