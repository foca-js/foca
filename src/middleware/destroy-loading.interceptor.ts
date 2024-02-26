import type { Middleware } from 'redux';
import { isDestroyLoadingAction } from '../actions/loading';

export const destroyLoadingInterceptor: Middleware =
  (api) => (dispatch) => (action) => {
    if (
      !isDestroyLoadingAction(action) ||
      api.getState().hasOwnProperty(action.model)
    ) {
      return dispatch(action);
    }

    return action;
  };
