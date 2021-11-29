import isEqual from 'lodash.isequal';
import type { AnyAction, Middleware } from 'redux';
import type { metaStore, MetaState } from '../store/metaStore';
import { metaKey } from '../utils/metaKey';

export const metaInterceptor = (
  helper: typeof metaStore['helper'],
): Middleware<{}, MetaState> => {
  return (api) => (dispatch) => (action: AnyAction) => {
    if (!helper.isMeta(action)) {
      return dispatch(action);
    }

    const { model, method, payload, category } = action;

    if (!helper.isActive(model, method)) {
      return;
    }

    const state = api.getState()[model];

    if (
      !state ||
      !state[method] ||
      !isEqual(state[method]![metaKey(category)], payload)
    ) {
      return dispatch(action);
    }

    return action;
  };
};
