import isEqual from 'lodash.isequal';
import type { AnyAction, Middleware } from 'redux';
import type { metaStore, MetaState } from '../store/metaStore';
import { resolveMetaCategory } from '../utils/resolveMetaCategory';

export const metaInterceptor = (
  helper: typeof metaStore['helper'],
): Middleware => {
  return (api) => (dispatch) => (action: AnyAction) => {
    if (!helper.isMeta(action)) {
      return dispatch(action);
    }

    const state = api.getState() as MetaState;

    if (state === void 0) {
      return dispatch(action);
    }
    const { model, method, payload } = action;

    if (!helper.isActive(model, method)) {
      return;
    }

    const category = resolveMetaCategory(action.category);

    if (
      !state[model] ||
      !state[model]![method] ||
      !state[model]![method]![category] ||
      !isEqual(state[model]![method]![category]!, payload)
    ) {
      return dispatch(action);
    }

    return;
  };
};
