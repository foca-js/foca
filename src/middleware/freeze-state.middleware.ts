import { freeze } from 'immer';
import type { Middleware } from 'redux';

export const freezeStateMiddleware: Middleware = (api) => {
  freeze(api.getState(), true);

  return (dispatch) => (action) => {
    try {
      return dispatch(action);
    } finally {
      freeze(api.getState(), true);
    }
  };
};
