import { parseState, stringifyState } from '../utils/serialize';
import { deepEqual } from '../utils/deep-equal';
import { EnhancedAction, enhanceAction } from './enhance-action';
import { EnhancedEffect, enhanceEffect } from './enhance-effect';
import { modelStore } from '../store/model-store';
import { createReducer } from '../redux/create-reducer';
import { composeGetter, defineGetter } from '../utils/getter';
import { getMethodCategory } from '../utils/get-method-category';
import { guard } from './guard';
import { depsCollector } from '../reactive/deps-collector';
import { ObjectDeps } from '../reactive/object-deps';
import type {
  ActionCtx,
  EffectCtx,
  DefineModelOptions,
  GetInitialState,
  GetState,
  Model,
  ComputedCtx,
  EventCtx,
  InternalModel,
  SetStateCallback,
  ComputedFlag,
} from './types';
import { isFunction } from '../utils/is-type';
import { Unsubscribe } from 'redux';
import { freeze, original, isDraft } from 'immer';
import { isPromise } from '../utils/is-promise';
import { enhanceComputed } from './enhance-computed';

export const defineModel = <
  Name extends string,
  State extends object,
  Action extends object,
  Effect extends object,
  Computed extends object,
  PersistDump,
>(
  uniqueName: Name,
  options: DefineModelOptions<State, Action, Effect, Computed, PersistDump>,
): Model<Name, State, Action, Effect, Computed> => {
  guard(uniqueName);

  const { reducers, methods, computed, skipRefresh, events } = options;
  /**
   * 防止初始化数据在外面被修改从而影响到store，
   * 这属于小概率事件，所以仅需要在开发环境处理，
   * 而且在严格模式下，runtime修改冻结数据会直接报错，可以提醒开发者修正
   */
  const initialState =
    process.env.NODE_ENV !== 'production'
      ? freeze(options.initialState, true)
      : options.initialState;

  if (process.env.NODE_ENV !== 'production') {
    const items = [
      { name: 'reducers', value: reducers },
      { name: 'methods', value: methods },
      { name: 'computed', value: computed },
    ];
    const validateUniqueMethod = (index1: number, index2: number) => {
      const item1 = items[index1]!;
      const item2 = items[index2]!;
      if (item1.value && item2.value) {
        Object.keys(item1.value).forEach((key) => {
          if (item2.value!.hasOwnProperty(key)) {
            throw new Error(
              `[model:${uniqueName}] 属性'${key}'在${item1.name}和${item2.name}中重复使用`,
            );
          }
        });
      }
    };
    validateUniqueMethod(0, 1);
    validateUniqueMethod(0, 2);
    validateUniqueMethod(1, 2);
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!deepEqual(parseState(stringifyState(initialState)), initialState)) {
      throw new Error(
        `[model:${uniqueName}] initialState 包含了不可系列化的数据，允许的类型为：Object, Array, Number, String, Undefined 和 Null`,
      );
    }
  }

  const getState = <T extends object>(obj: T): T & GetState<State> => {
    return defineGetter(obj, 'state', () => {
      const state = modelStore.getState()[uniqueName];
      return depsCollector.active
        ? new ObjectDeps(modelStore, uniqueName).start(state)
        : state;
    });
  };

  const getInitialState = <T extends object>(
    obj: T,
  ): T & GetInitialState<State> => {
    return defineGetter(obj, 'initialState', () =>
      parseState(stringifyState(initialState)),
    );
  };

  const actionCtx: ActionCtx<State> = composeGetter(
    {
      name: uniqueName,
    },
    getInitialState,
  );

  const createEffectCtx = (methodName: string): EffectCtx<State> => {
    const isArrayState = Array.isArray(initialState);
    const obj: Pick<EffectCtx<State>, 'setState'> = {
      // @ts-expect-error
      setState: enhanceAction(
        actionCtx,
        `${methodName}.setState`,
        <K extends keyof State>(
          state: State,
          fn_state: SetStateCallback<State, K> | State | Pick<State, K>,
        ) => {
          const nextState = isFunction<SetStateCallback<State, K>>(fn_state)
            ? fn_state(state)
            : fn_state;

          if (nextState === void 0) return;

          return isArrayState || isDraft(nextState)
            ? nextState
            : Object.assign({}, original(state), nextState);
        },
      ),
    };
    return composeGetter(
      Object.assign(obj, { name: uniqueName }),
      getState,
      getInitialState,
    );
  };

  const enhancedMethods: {
    [K in ReturnType<typeof getMethodCategory>]: Record<
      string,
      EnhancedAction<State> | EnhancedEffect | ComputedFlag
    >;
  } = {
    external: {},
    internal: {},
  };

  if (reducers) {
    const reducerKeys = Object.keys(reducers);
    for (let i = reducerKeys.length; i-- > 0; ) {
      const key = reducerKeys[i]!;
      enhancedMethods[getMethodCategory(key)][key] = enhanceAction(
        actionCtx,
        key,
        reducers[key]!,
      );
    }
  }

  if (computed) {
    const computedCtx: ComputedCtx<State> & {
      [K in string]?: ComputedFlag;
    } = composeGetter({ name: uniqueName }, getState);
    const computedKeys = Object.keys(computed);

    for (let i = computedKeys.length; i-- > 0; ) {
      const key = computedKeys[i]!;
      computedCtx[key] = enhancedMethods[getMethodCategory(key)][key] =
        enhanceComputed(
          computedCtx,
          uniqueName,
          key,
          // @ts-expect-error
          computed[key],
        );
    }
  }

  if (methods) {
    let ctx: EffectCtx<State>;
    const ctxs: EffectCtx<State>[] = [(ctx = createEffectCtx(''))];
    const methodKeys = Object.keys(methods);

    for (let i = methodKeys.length; i-- > 0; ) {
      const key = methodKeys[i]!;
      if (process.env.NODE_ENV !== 'production') {
        ctxs.push((ctx = createEffectCtx(key)));
      }

      enhancedMethods[getMethodCategory(key)][key] = enhanceEffect(
        ctx,
        key,
        // @ts-expect-error
        methods[key],
      );
    }

    for (let i = ctxs.length; i-- > 0; ) {
      Object.assign(
        ctxs[i]!,
        enhancedMethods.external,
        enhancedMethods.internal,
      );
    }
  }

  if (events) {
    const { onInit, onChange, onDestroy } = events;
    const eventCtx: EventCtx<State> = Object.assign(
      composeGetter({ name: uniqueName }, getState),
      enhancedMethods.external,
      enhancedMethods.internal,
    );

    modelStore.onInitialized().then(() => {
      const subscriptions: Unsubscribe[] = [];

      if (onChange) {
        let prevState = eventCtx.state;
        subscriptions.push(
          modelStore.subscribe(() => {
            const nextState = eventCtx.state;
            if (
              modelStore.isReady &&
              prevState !== nextState &&
              nextState !== void 0
            ) {
              onChange.call(eventCtx, prevState, nextState);
            }
            prevState = nextState;
          }),
        );
      }

      if (onDestroy) {
        subscriptions.push(
          modelStore.subscribe(() => {
            if (eventCtx.state === void 0) {
              for (let i = 0; i < subscriptions.length; ++i) {
                subscriptions[i]!();
              }
              onDestroy.call(null as never, uniqueName);
            }
          }),
        );
      }

      if (onInit) {
        /**
         * 初始化时，用到它的React组件可能还没加载，所以执行async-method时无法判断是否需要保存loading。因此需要一个钩子来处理事件周期
         * @see https://github.com/foca-js/foca/issues/38
         */
        modelStore.topic.publish('modelPreInit', uniqueName);
        const promiseOrVoid = onInit.call(eventCtx);
        const postInit = () => {
          modelStore.topic.publish('modelPostInit', uniqueName);
        };
        if (isPromise(promiseOrVoid)) {
          promiseOrVoid.then(postInit, postInit);
        } else {
          postInit();
        }
      }
    });
  }

  modelStore['appendReducer'](
    uniqueName,
    createReducer({
      name: uniqueName,
      initialState,
      allowRefresh: !skipRefresh,
    }),
  );

  const model: InternalModel<Name, State, Action, Effect, Computed> =
    Object.assign(
      composeGetter(
        {
          name: uniqueName,
          _$opts: options,
          _$persistCtx: getInitialState({}),
        },
        getState,
      ),
      enhancedMethods.external,
    );

  return model as any;
};
