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
  const {
    actions,
    effects,
    computed,
    skipRefresh,
    events = options.hooks,
  } = options;
  const initialState = cloneDeep(options.initialState);

  if (process.env.NODE_ENV !== 'production') {
    if (options.hooks) {
      console.warn(
        `[model:${uniqueName}] Use option 'events' instead of 'hooks' which is confused with react-hooks, and 'hooks' will be removed once 1.0.0 is released`,
      );
    }
  }

  if (process.env.NODE_ENV !== 'production') {
    if (!deepEqual(initialState, options.initialState)) {
      throw new Error(
        `[model:${uniqueName}] initialState contains unserializable data, the available types are Object, Array, Number, String and Null`,
      );
    }
  }

  const getName = <T extends object>(obj: T): T & GetName<Name> => {
    return defineGetter(obj, 'name', () => uniqueName);
  };

  const getState = <T extends object>(obj: T): T & GetState<State> => {
    return defineGetter(obj, 'state', () => {
      const state = modelStore.getState()[uniqueName];
      return depsCollector.collecting
        ? new ObjectDeps(modelStore, uniqueName).start(state)
        : state;
    });
  };

  const getInitialState = <T extends object>(
    obj: T,
  ): T & GetInitialState<State> => {
    return defineGetter(obj, 'initialState', () => cloneDeep(initialState));
  };

  guard(uniqueName);

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
              `[model:${uniqueName}] You have defined method "${key}" in both ${item1.name} and ${item2.name}`,
            );
          }
        });
      }
    };
    validateUniqueMethod(0, 1);
    validateUniqueMethod(0, 2);
    validateUniqueMethod(1, 2);
  }

  const actionCtx: ActionCtx<State> = composeGetter(
    {},
    getName,
    getState,
    getInitialState,
  );

  const createEffectCtx = (methodName: string): EffectCtx<State> => {
    type StateCallback = (state: State) => State | void;

    const obj: Pick<EffectCtx<State>, 'setState'> = {
      setState: enhanceAction(
        actionCtx,
        `${methodName}.setState`,
        (state: State, fn_state: State | StateCallback) => {
          /**
           * 函数类型有时候会推导失败，需要强制指定
           * @since typescript@4.6
           * @link https://github.com/microsoft/TypeScript/issues/48118
           */
          return typeof fn_state === 'function'
            ? (fn_state as StateCallback)(state)
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
    const computedCtx: ComputedCtx<State> = composeGetter(
      {},
      getName,
      getState,
    );

    const computedMethods: Record<string, ComputedValue> = {};

    Object.keys(computed).forEach((computedName) => {
      computedMethods[computedName] = enhancedMethods[
        getMethodCategory(computedName)
      ][computedName] = new ComputedValue(
        modelStore,
        uniqueName,
        computedName,
        // @ts-expect-error
        (computed[computedName] as Function).bind(computedCtx),
      );
    });

    Object.assign(computedCtx, computedMethods);
  }

  if (effects) {
    const effectCtxs: EffectCtx<State>[] = [createEffectCtx('')];

    Object.keys(effects).forEach((effectName) => {
      process.env.NODE_ENV !== 'production' &&
        effectCtxs.push(createEffectCtx(effectName));
      enhancedMethods[getMethodCategory(effectName)][effectName] =
        enhanceEffect(
          effectCtxs[effectCtxs.length - 1]!,
          effectName,
          // @ts-expect-error
          effects[effectName],
        );
    });

    effectCtxs.forEach((ctx) => {
      Object.assign(ctx, enhancedMethods.external, enhancedMethods.internal);
    });
  }

  if (events) {
    const { onInit, onChange } = events;
    const hookCtx: EventCtx<State> = Object.assign(
      composeGetter({}, getName, getState),
      enhancedMethods.external,
      enhancedMethods.internal,
    );

    if (onChange) {
      modelStore.onInitialized().then(() => {
        let prevState = hookCtx.state;
        modelStore.subscribe(() => {
          const nextState = hookCtx.state;
          if (prevState !== nextState) {
            modelStore.isReady && onChange.call(hookCtx, prevState, nextState);
            prevState = nextState;
          }
        });
      });
    }

    if (onInit) {
      modelStore.onInitialized().then(() => {
        onInit.call(hookCtx);
      });
    }
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
