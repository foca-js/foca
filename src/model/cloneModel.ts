import cloneDeep from 'clone';
import assign from 'object-assign';
import { DuplicateModelError } from '../exceptions/DuplicateModelError';
import {
  defineModel,
  Model,
  InternalModel,
  DefineModelOptions,
} from './defineModel';

export const cloneModel = <
  Name extends string,
  State extends object,
  Action extends object,
  Effect extends object,
>(
  name: Name,
  model: Model<string, State, Action, Effect>,
  options?: Partial<
    Pick<
      DefineModelOptions<State, Action, Effect>,
      'initialState' | 'keepStateFromRefresh' | 'persist'
    >
  >,
): Model<Name, State, Action, Effect> => {
  if (name === model.name) {
    throw new DuplicateModelError(
      `Stop to clone model with the same name ${name}`,
    );
  }

  const realModel = model as unknown as InternalModel<
    string,
    State,
    Action,
    Effect
  >;
  const originalOptions = cloneDeep(realModel._$opts, false);

  options && assign(originalOptions, options);

  return defineModel(name, originalOptions);
};
