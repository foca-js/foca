import { shallowEqual } from 'react-redux';
import { deepEqual } from '../utils/deepEqual';
import type { HookModel, Model } from './types';
import { toArgs } from '../utils/toArgs';
import { useModelSelector } from '../redux/useSelector';
import { isFunction, isString } from '../utils/isType';

/**
 * hooks新旧数据的对比方式：
 *
 * - `deepEqual`     深度对比，对比所有层级的内容。传递selector时默认使用。
 * - `shallowEqual`  浅对比，只比较对象第一层。传递多个模型但没有selector时默认使用。
 * - `strictEqual`   全等（===）对比。只传一个模型但没有selector时默认使用。
 */
export type Algorithm = 'strictEqual' | 'shallowEqual' | 'deepEqual';

/**
 * * 获取模型的状态数据。
 * * 传入一个模型时，将返回该模型的状态。
 * * 传入多个模型时，则返回一个以模型名称为key、状态为value的大对象。
 * * 最后一个参数如果是**函数**，则为状态过滤函数，过滤函数的结果视为最终返回值。
 */
export function useModel<State extends object>(
  model: Model<string, State> | HookModel<string, State>,
): State;
export function useModel<State extends object, T>(
  model: Model<string, State> | HookModel<string, State>,
  selector: (state: State) => T,
  algorithm?: Algorithm,
): T;

export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
): {
  [K in Name1]: State1;
} & {
  [K in Name2]: State2;
};
export function useModel<State1 extends object, State2 extends object, T>(
  model1: Model<string, State1>,
  model2: Model<string, State2>,
  selector: (state1: State1, state2: State2) => T,
  algorithm?: Algorithm,
): T;

export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  model3: Model<Name3, State3>,
): {
  [K in Name1]: State1;
} & {
  [K in Name2]: State2;
} & {
  [K in Name3]: State3;
};
export function useModel<
  State1 extends object,
  State2 extends object,
  State3 extends object,
  T,
>(
  model1: Model<string, State1>,
  model2: Model<string, State2>,
  model3: Model<string, State3>,
  selector: (state1: State1, state2: State2, state3: State3) => T,
  algorithm?: Algorithm,
): T;

export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
  Name4 extends string,
  State4 extends object,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  model3: Model<Name3, State3>,
  model4: Model<Name4, State4>,
): {
  [K in Name1]: State1;
} & {
  [K in Name2]: State2;
} & {
  [K in Name3]: State3;
} & {
  [K in Name4]: State4;
};
export function useModel<
  State1 extends object,
  State2 extends object,
  State3 extends object,
  State4 extends object,
  T,
>(
  model1: Model<string, State1>,
  model2: Model<string, State2>,
  model3: Model<string, State3>,
  model4: Model<string, State4>,
  selector: (
    state1: State1,
    state2: State2,
    state3: State3,
    state4: State4,
  ) => T,
  algorithm?: Algorithm,
): T;

export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
  Name4 extends string,
  State4 extends object,
  Name5 extends string,
  State5 extends object,
>(
  model1: Model<Name1, State1>,
  model2: Model<Name2, State2>,
  model3: Model<Name3, State3>,
  model4: Model<Name4, State4>,
  model5: Model<Name5, State5>,
): {
  [K in Name1]: State1;
} & {
  [K in Name2]: State2;
} & {
  [K in Name3]: State3;
} & {
  [K in Name4]: State4;
} & {
  [K in Name5]: State5;
};
export function useModel<
  State1 extends object,
  State2 extends object,
  State3 extends object,
  State4 extends object,
  State5 extends object,
  T,
>(
  model1: Model<string, State1>,
  model2: Model<string, State2>,
  model3: Model<string, State3>,
  model4: Model<string, State4>,
  model5: Model<string, State5>,
  selector: (
    state1: State1,
    state2: State2,
    state3: State3,
    state4: State4,
    state5: State5,
  ) => T,
  algorithm?: Algorithm,
): T;

export function useModel(): any {
  const args = toArgs(arguments);
  let algorithm: Algorithm | false =
    args.length > 1 && isString(args[args.length - 1]) && args.pop();
  const selector: Function | false =
    args.length > 1 && isFunction(args[args.length - 1]) && args.pop();
  const models: Model[] = args;
  const modelsLength = models.length;
  const onlyOneModel = modelsLength === 1;

  if (!algorithm) {
    if (selector) {
      // 返回子集或者计算过的内容。
      // 如果只是从模型中获取数据且没有做转换，则大部分时间会降级为shallow或者strict。
      // 如果对数据做了转换，则肯定需要使用深对比。
      algorithm = 'deepEqual';
    } else if (onlyOneModel) {
      // 一个model属于一个reducer，reducer已经使用了深对比来判断是否变化，
      algorithm = 'strictEqual';
    } else {
      // { key => model } 集合。
      // 一个model属于一个reducer，reducer已经使用了深对比来判断是否变化，
      algorithm = 'shallowEqual';
    }
  }

  // 储存了结果说明是state状态变化导致的对比计算。
  // 因为存在闭包，除模型外的所有参数都是旧的，
  // 所以我们只需要保证用到的模型数据不变即可，这样可以减少无意义的计算。
  let hasMemo = false,
    snapshot: any,
    memoStates: object[],
    currentStates: object[],
    i: number,
    changed: boolean;

  const reducerNames: string[] = [];
  for (i = 0; i < modelsLength; ++i) {
    reducerNames.push(models[i]!.name);
  }

  return useModelSelector((state: Record<string, object>) => {
    currentStates = [];
    for (i = 0; i < modelsLength; ++i) {
      currentStates.push(state[reducerNames[i]!]!);
    }

    if (hasMemo) {
      // 大部分业务场景，用户只会传入一个模型（符合直觉），所以值得额外的快速对比
      if (onlyOneModel) {
        if (currentStates[0] === memoStates[0]) return snapshot;
      } else {
        for (i = modelsLength, changed = false; i-- > 0; ) {
          if (currentStates[i] !== memoStates[i]) {
            changed = true;
            break;
          }
        }

        if (!changed) return snapshot;
      }
    }

    hasMemo = true;
    memoStates = currentStates;

    if (onlyOneModel) {
      return (snapshot = selector
        ? selector(currentStates[0])
        : currentStates[0]);
    }

    if (selector) {
      return (snapshot = selector.apply(null, currentStates));
    }

    snapshot = {};
    for (i = modelsLength; i-- > 0; ) {
      snapshot[reducerNames[i]!] = currentStates[i]!;
    }
    return snapshot;
  }, compareFn[algorithm]);
}

const compareFn: Record<
  Algorithm,
  undefined | ((previous: any, next: any) => boolean)
> = {
  deepEqual: deepEqual,
  shallowEqual: shallowEqual,
  strictEqual: void 0,
};
