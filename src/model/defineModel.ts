import { cloneDeep } from '../utils/cloneDeep';
import { deepEqual } from '../utils/deepEqual';
import { EnhancedAction, enhanceAction } from './enhanceAction';
import { EnhancedEffect, enhanceEffect } from './enhanceEffect';
import { modelStore } from '../store/modelStore';
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
  GetName,
  GetState,
  Model,
  ComputedCtx,
  EventCtx,
  InternalModel,
} from './types';
import { isFunction } from '../utils/isType';
import { Unsubscribe } from 'redux';

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
    actions,
    effects,
    computed,
    skipRefresh,
    events = options.hooks,
  } = options;
  const initialState = cloneDeep(options.initialState);

  if (process.env.NODE_ENV !== 'production') {
    const items = [
      { name: 'actions', value: actions },
      { name: 'effects', value: effects },
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
    if (options.hooks) {
      console.warn(
        `[model:${uniqueName}] 属性'hooks'已经重命名为'events'了，原因是和react的hooks同名，容易产生误解。属性'hooks'将在版本1.0.0发布时删除`,
      );
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!deepEqual(initialState, options.initialState)) {
      throw new Error(
        `[model:${uniqueName}] initialState 包含了不可系列化的数据，允许的类型为：Object, Array, Number, String 和 Null`,
      );
    }
  }

  const getName = <T extends object>(obj: T): T & GetName<Name> => {
    return defineGetter(obj, 'name', () => uniqueName);
  };

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
    return defineGetter(obj, 'initialState', () => cloneDeep(initialState));
  };

  const actionCtx: ActionCtx<State> = composeGetter(
    {},
    getName,
    getInitialState,
  );

  const createEffectCtx = (methodName: string): EffectCtx<State> => {
    type StateCallback = (state: State) => State | void;

    const obj: Pick<EffectCtx<State>, 'setState'> = {
      setState: enhanceAction(
        actionCtx,
        `${methodName}.setState`,
        (state: State, fn_state: State | StateCallback) => {
          return isFunction<StateCallback>(fn_state)
            ? fn_state(state)
            : fn_state;
        },
      ),
    };
    return composeGetter(obj, getName, getState, getInitialState);
  };

  const enhancedMethods: {
    [key in ReturnType<typeof getMethodCategory>]: Record<
      string,
      EnhancedAction<State> | EnhancedEffect | ComputedValue
    >;
  } = {
    external: {},
    internal: {},
  };

  if (actions) {
    Object.keys(actions).forEach((actionName) => {
      enhancedMethods[getMethodCategory(actionName)][actionName] =
        enhanceAction(actionCtx, actionName, actions[actionName]!);
    });
  }

  if (computed) {
    const computedCtx: ComputedCtx<State> & {
      [K in string]?: ComputedValue;
    } = composeGetter({}, getName, getState);

    Object.keys(computed).forEach((computedName) => {
      computedCtx[computedName] = enhancedMethods[
        getMethodCategory(computedName)
      ][computedName] = new ComputedValue(
        modelStore,
        uniqueName,
        computedName,
        // @ts-expect-error
        (computed[computedName] as Function).bind(computedCtx),
      );
    });
  }

  if (effects) {
    const effectCtxs: EffectCtx<State>[] = [createEffectCtx('')];

    Object.keys(effects).forEach((effectName) => {
      let ctx = effectCtxs[0]!;

      if (process.env.NODE_ENV !== 'production') {
        effectCtxs.push(createEffectCtx(effectName));
        ctx = effectCtxs[effectCtxs.length - 1]!;
      }

      enhancedMethods[getMethodCategory(effectName)][effectName] =
        enhanceEffect(
          ctx,
          effectName,
          // @ts-expect-error
          effects[effectName],
        );
    });

    for (let i = effectCtxs.length; i-- > 0; ) {
      Object.assign(
        effectCtxs[i]!,
        enhancedMethods.external,
        enhancedMethods.internal,
      );
    }
  }

  if (events) {
    const { onInit, onChange, onDestroy } = events;
    const eventCtx: EventCtx<State> = Object.assign(
      composeGetter({}, getName, getState),
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
            if (prevState !== nextState) {
              modelStore.isReady &&
                onChange.call(eventCtx, prevState, nextState);
              prevState = nextState;
            }
          }),
        );
      }

      onInit && onInit.call(eventCtx);

      if (onDestroy) {
        subscriptions.push(
          modelStore.subscribe(() => {
            if (eventCtx.state === void 0) {
              subscriptions.forEach((executor) => executor());
              onDestroy.call(null as never);
            }
          }),
        );
      }
    });
  }

  modelStore.appendReducer(
    uniqueName,
    createReducer({
      name: uniqueName,
      initialState: initialState,
      allowRefresh: !skipRefresh,
    }),
  );

  const model: InternalModel<Name, State, Action, Effect, Computed> =
    Object.assign(
      composeGetter(
        {
          _$opts: options,
        },
        getName,
        getState,
      ),
      enhancedMethods.external,
    );

  return model as any;
};
