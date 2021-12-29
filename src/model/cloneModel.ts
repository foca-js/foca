import {
  defineModel,
  Model,
  InternalModel,
  DefineModelOptions,
} from './defineModel';

type OverrideOptions<
  State extends object,
  Action extends object,
  Effect extends object,
> = Pick<
  DefineModelOptions<State, Action, Effect>,
  'initialState' | 'hooks' | 'persist' | 'skipRefresh'
>;

export const cloneModel = <
  Name extends string,
  State extends object,
  Action extends object,
  Effect extends object,
>(
  uniqueName: Name,
  model: Model<string, State, Action, Effect>,
  options?:
    | Partial<OverrideOptions<State, Action, Effect>>
    | ((
        prev: OverrideOptions<State, Action, Effect>,
      ) => Partial<OverrideOptions<State, Action, Effect>>),
): Model<Name, State, Action, Effect> => {
  const realModel = model as unknown as InternalModel<
    string,
    State,
    Action,
    Effect
  >;

  const prevOpts = realModel._$opts;
  const nextOpts = Object.assign({}, prevOpts);

  if (options) {
    Object.assign(
      nextOpts,
      typeof options === 'function' ? options(nextOpts) : options,
    );
    // 防止被开发者覆盖
    nextOpts.actions = prevOpts.actions;
    nextOpts.effects = prevOpts.effects;
  }

  return defineModel(uniqueName, nextOpts);
};
