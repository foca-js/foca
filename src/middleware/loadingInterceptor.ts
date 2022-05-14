import type { AnyAction, Middleware } from 'redux';
import type { loadingStore, LoadingStoreState } from '../store/loadingStore';
import { isLoadingAction } from '../actions/loading';

export const loadingInterceptor = (
  helper: typeof loadingStore['helper'],
): Middleware<{}, LoadingStoreState> => {
  return (api) => (dispatch) => (action: AnyAction) => {
    if (!isLoadingAction(action)) {
      return dispatch(action);
    }

    const {
      model,
      method,
      payload: { category, loading },
    } = action;
    const combineKey = helper.keyOf(model, method);

    if (!helper.isActive(combineKey)) {
      return;
    }

    const state = api.getState()[combineKey];

    if (!state || state.loadings.data[category] !== loading) {
      return dispatch(action);
    }

    return action;
  };
};
