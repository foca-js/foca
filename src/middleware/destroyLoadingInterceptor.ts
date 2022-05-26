import type { Middleware, AnyAction } from 'redux';
import { isDestroyLoadingAction } from '../actions/loading';

export const destroyLoadingInterceptor: Middleware =
  (api) => (dispatch) => (action: AnyAction) => {
    if (
      !isDestroyLoadingAction(action) ||
      api.getState().hasOwnProperty(action.model)
    ) {
      return dispatch(action);
    }

    return false;
  };
