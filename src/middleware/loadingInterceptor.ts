import type { AnyAction, Middleware } from 'redux';
import type { LoadingStore, LoadingStoreState } from '../store/loadingStore';
import { isLoadingAction } from '../actions/loading';

export const loadingInterceptor = (
  loadingStore: LoadingStore,
): Middleware<{}, LoadingStoreState> => {
  return () => (dispatch) => (action: AnyAction) => {
    if (!isLoadingAction(action)) {
      return dispatch(action);
    }

    const {
      model,
      method,
      payload: { category, loading },
    } = action;

    if (!loadingStore.isActive(model, method)) return;

    const record = loadingStore.getItem(model, method);

    if (!record || record.loadings.data[category] !== loading) {
      return dispatch(action);
    }

    return action;
  };
};
