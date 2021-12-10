import type { AnyAction, Middleware } from 'redux';
import { deepEqual } from '../utils/deepEqual';
import type { metaStore, MetaStoreState } from '../store/metaStore';

export const metaInterceptor = (
  helper: typeof metaStore['helper'],
): Middleware<{}, MetaStoreState> => {
  return (api) => (dispatch) => (action: AnyAction) => {
    if (!helper.isMeta(action)) {
      return dispatch(action);
    }

    const { model, method, payload, category } = action;
    const combineKey = helper.keyOf(model, method);

    if (!helper.isActive(combineKey)) {
      return;
    }

    const state = api.getState()[combineKey];

    if (!state || !deepEqual(state.metas.data[category], payload)) {
      return dispatch(action);
    }

    return action;
  };
};
