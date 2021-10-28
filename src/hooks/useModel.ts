import isEqual from 'lodash.isequal';
import { Model } from '../model/defineModel';
import { useCustomSelector } from './useCustomSelector';

/**
 * * 获取模型的状态数据。
 * * 传入一个模型时，将返回该模型的状态。
 * * 传入多个模型时，则返回一个以模型名称为key、状态为value的大对象。
 * * 最后一个参数如果是**函数**，则为状态过滤函数，过滤函数的结果视为最终返回值。
 */
export function useModel<State extends object>(model: Model<string, State, object, object>): State;
export function useModel<State extends object, T>(
  model: Model<any, State, object, object>,
  selector: (state: State) => T,
): T;

export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
>(
  model1: Model<Name1, State1, object, object>,
  model2: Model<Name2, State2, object, object>,
): {
  [K in Name1]: State1;
} & {
  [K in Name2]: State2;
};
export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  T,
>(
  model1: Model<Name1, State1, object, object>,
  model2: Model<Name2, State2, object, object>,
  selector: (state1: State1, state2: State2) => T,
): T;

export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
>(
  model1: Model<Name1, State1, object, object>,
  model2: Model<Name2, State2, object, object>,
  model3: Model<Name3, State3, object, object>,
): {
  [K in Name1]: State1;
} & {
  [K in Name2]: State2;
} & {
  [K in Name3]: State3;
};
export function useModel<
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
  T,
>(
  model1: Model<Name1, State1, object, object>,
  model2: Model<Name2, State2, object, object>,
  model3: Model<Name3, State3, object, object>,
  selector: (state1: State1, state2: State2, state3: State3) => T,
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
  model1: Model<Name1, State1, object, object>,
  model2: Model<Name2, State2, object, object>,
  model3: Model<Name3, State3, object, object>,
  model4: Model<Name4, State4, object, object>,
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
  Name1 extends string,
  State1 extends object,
  Name2 extends string,
  State2 extends object,
  Name3 extends string,
  State3 extends object,
  Name4 extends string,
  State4 extends object,
  T,
>(
  model1: Model<Name1, State1, object, object>,
  model2: Model<Name2, State2, object, object>,
  model3: Model<Name3, State3, object, object>,
  model4: Model<Name4, State4, object, object>,
  selector: (state1: State1, state2: State2, state3: State3, state4: State4) => T,
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
  model1: Model<Name1, State1, object, object>,
  model2: Model<Name2, State2, object, object>,
  model3: Model<Name3, State3, object, object>,
  model4: Model<Name4, State4, object, object>,
  model5: Model<Name5, State5, object, object>,
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
  T,
>(
  model1: Model<Name1, State1, object, object>,
  model2: Model<Name2, State2, object, object>,
  model3: Model<Name3, State3, object, object>,
  model4: Model<Name4, State4, object, object>,
  model5: Model<Name5, State5, object, object>,
  selector: (state1: State1, state2: State2, state3: State3, state4: State4, state5: State5) => T,
): T;

export function useModel(...args: any[]): any {
  const models = args as Model<any, any, object, object>[];
  const selector: Function | undefined =
    typeof args[args.length - 1] === 'function' ? args.pop() : void 0;

  return useCustomSelector((state) => {
    if (selector) {
      return selector.apply(
        null,
        models.map((model) => state[model.name]),
      );
    }

    if (models.length === 1) {
      return state[models[0]!.name];
    }

    const result: Record<string, any> = {};
    models.forEach((item) => {
      result[item.name] = state[item.name];
    });
    return result;
  }, isEqual);
}
