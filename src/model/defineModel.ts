import { parseState, stringifyState } from '../utils/serialize';
import { deepEqual } from '../utils/deepEqual';
import { EnhancedAction, enhanceAction } from './enhanceAction';
import { EnhancedEffect, enhanceEffect } from './enhanceEffect';
import { ModelStore, modelStore } from '../store/modelStore';
import { createReducer } from '../redux/createReducer';
import { composeGetter, defineGetter } from '../utils/getter';
import { getMethodCategory } from '../utils/getMethodCategory';
import { guard } from './guard';
import { ComputedValue } from '../reactive/ComputedValue';
import { depsCollector } from '../reactive/depsCollector';
import { ObjectDeps } from '../reactive/ObjectDeps';
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
} from './types';
import { isFunction } from '../utils/isType';
import { Unsubscribe } from 'redux';
import { original } from 'immer';

export const defineModel = <
  Name extends string,
  State extends object,
  Action extends object,
  Effect extends object,
  Computed extends object,
>(
  uniqueName: Name,
  options: DefineModelOptions<State, Action, Effect, Computed>,
): Model<Name, State, Action, Effect, Computed> => {
  guard(uniqueName);

  const {
    reducers = options.actions,
    methods = options.effects,
    computed,
    skipRefresh,
    events,
  } = options;
  const isArrayState = Array.isArray(options.initialState);
  const initialStateStr = stringifyState(options.initialState);

  if (process.env.NODE_ENV !== 'production') {
    if (options.actions) {
      console.warn(
        `[model:${uniqueName}] 属性actions已经重命名为reducers，建议使用编辑器进行批量替换。该属性将在2.0.0版本发布时删除`,
      );
    }

    if (options.effects) {
      console.warn(
        `[model:${uniqueName}] 属性effects已经重命名为methods，建议使用编辑器进行批量替换。该属性将在2.0.0版本发布时删除`,
      );
    }
  }

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
    if (!deepEqual(parseState(initialStateStr), options.initialState)) {
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
    return defineGetter(obj, 'initialState', () => parseState(initialStateStr));
  };

  const actionCtx: ActionCtx<State> = composeGetter(
    {
      name: uniqueName,
    },
    getInitialState,
  );

  const createEffectCtx = (methodName: string): EffectCtx<State> => {
    type StateCallback = (state: State) => State | void;

    const obj: Pick<EffectCtx<State>, 'setState'> = {
      setState: enhanceAction(
        actionCtx,
        `${methodName}.setState`,
        (state: State, fn_state: State | StateCallback) => {
          if (isFunction<StateCallback>(fn_state)) {
            return fn_state(state);
          }

          if (isArrayState) return fn_state;

          return Object.assign({}, original(state), fn_state);
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
      EnhancedAction<State> | EnhancedEffect | ComputedValue
    >;
  } = {
    external: {},
    internal: {},
  };

  if (reducers) {
    Object.keys(reducers).forEach((key) => {
      enhancedMethods[getMethodCategory(key)][key] = enhanceAction(
        actionCtx,
        key,
        reducers[key]!,
      );
    });
  }

  if (computed) {
    const computedCtx: ComputedCtx<State> & {
      [K in string]?: ComputedValue;
    } = composeGetter({ name: uniqueName }, getState);

    Object.keys(computed).forEach((key) => {
      computedCtx[key] = enhancedMethods[getMethodCategory(key)][key] =
        new ComputedValue(
          modelStore,
          uniqueName,
          key,
          // @ts-expect-error
          (computed[key] as Function).bind(computedCtx),
        );
    });
  }

  if (methods) {
    let ctx: EffectCtx<State>;
    const ctxs: EffectCtx<State>[] = [(ctx = createEffectCtx(''))];

    Object.keys(methods).forEach((key) => {
      if (process.env.NODE_ENV !== 'production') {
        ctxs.push((ctx = createEffectCtx(key)));
      }

      enhancedMethods[getMethodCategory(key)][key] = enhanceEffect(
        ctx,
        key,
        // @ts-expect-error
        methods[key],
      );
    });

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
              subscriptions.forEach((unsubscribe) => unsubscribe());
              onDestroy.call(null as never);
            }
          }),
        );
      }

      onInit && onInit.call(eventCtx);
    });
  }

  ModelStore.appendReducer.call(
    modelStore,
    uniqueName,
    createReducer({
      name: uniqueName,
      initialState: parseState(initialStateStr),
      allowRefresh: !skipRefresh,
    }),
  );

  const model: InternalModel<Name, State, Action, Effect, Computed> =
    Object.assign(
      composeGetter(
        {
          name: uniqueName,
          _$opts: options,
        },
        getState,
      ),
      enhancedMethods.external,
    );

  return model as any;
};
