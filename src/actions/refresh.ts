import { AnyAction } from 'redux';

const TYPE_REFRESH_STORE = '@@store/refresh';

export interface RefreshAction {
  type: typeof TYPE_REFRESH_STORE;
  payload: {
    force: boolean;
  };
}

export const actionRefresh = (force: boolean): RefreshAction => {
  return {
    type: TYPE_REFRESH_STORE,
    payload: {
      force,
    },
  };
};

export const isRefreshAction = (action: AnyAction): action is RefreshAction => {
  return (action as RefreshAction).type === TYPE_REFRESH_STORE;
};
