import { freeze } from 'immer';
import type { AnyAction, Middleware } from 'redux';

export const freezeStateMiddleware: Middleware = (api) => {
  freeze(api.getState(), true);

  return (dispatch) => (action: AnyAction) => {
    try {
      return dispatch(action);
    } finally {
      freeze(api.getState(), true);
    }
  };
};
