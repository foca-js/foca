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

    if (!helper.isActive(helper.keyOf(model, method))) {
      return;
    }

    const record = api.getState()[model]?.[method];

    if (!record || record.loadings.data[category] !== loading) {
      return dispatch(action);
    }

    return action;
  };
};
