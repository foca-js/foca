import { isFunction } from '../utils/is-type';
import { defineModel } from './define-model';
import type { DefineModelOptions, InternalModel, Model } from './types';

const editableKeys = [
  'initialState',
  'events',
  'persist',
  'skipRefresh',
] as const;

type EditableKeys = (typeof editableKeys)[number];

type OverrideOptions<
  State extends object,
  Action extends object,
  Effect extends object,
  Computed extends object,
  PersistDump,
> = Pick<
  DefineModelOptions<State, Action, Effect, Computed, PersistDump>,
  EditableKeys
>;

export const cloneModel = <
  Name extends string,
  State extends object,
  Action extends object,
  Effect extends object,
  Computed extends object,
  PersistDump,
>(
  uniqueName: Name,
  model: Model<string, State, Action, Effect, Computed>,
  options?:
    | Partial<OverrideOptions<State, Action, Effect, Computed, PersistDump>>
    | ((
        prev: OverrideOptions<State, Action, Effect, Computed, PersistDump>,
      ) => Partial<
        OverrideOptions<State, Action, Effect, Computed, PersistDump>
      >),
): Model<Name, State, Action, Effect, Computed> => {
  const realModel = model as unknown as InternalModel<
    string,
    State,
    Action,
    Effect,
    Computed
  >;

  const prevOpts = realModel._$opts;
  const nextOpts = Object.assign({}, prevOpts);

  if (options) {
    Object.assign(nextOpts, isFunction(options) ? options(nextOpts) : options);

    if (process.env.NODE_ENV !== 'production') {
      (Object.keys(nextOpts) as EditableKeys[]).forEach((key) => {
        if (
          nextOpts[key] !== prevOpts[key] &&
          editableKeys.indexOf(key) === -1
        ) {
          throw new Error(
            `[model:${uniqueName}] 复制模型时禁止重写属性'${key}'`,
          );
        }
      });
    }
  }

  return defineModel(uniqueName, nextOpts);
};
