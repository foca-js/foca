import type { Middleware } from 'redux';
import type { LoadingStore, LoadingStoreState } from '../store/loading-store';
import { isLoadingAction } from '../actions/loading';

export const loadingInterceptor = (
  loadingStore: LoadingStore,
): Middleware<{}, LoadingStoreState> => {
  return () => (dispatch) => (action) => {
    if (!isLoadingAction(action)) {
      return dispatch(action);
    }

    const {
      model,
      method,
      payload: { category, loading },
    } = action;

    if (loadingStore.isModelInitializing(model)) {
      loadingStore.activate(model, method);
    } else if (!loadingStore.isActive(model, method)) {
      return;
    }

    const record = loadingStore.getItem(model, method);

    if (!record || record.loadings.data[category] !== loading) {
      return dispatch(action);
    }

    return action;
  };
};
