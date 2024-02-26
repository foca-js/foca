import type { UnknownAction } from 'redux';

const TYPE_REFRESH_STORE = '@@store/refresh';

export interface RefreshAction extends UnknownAction {
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

export const isRefreshAction = (
  action: UnknownAction,
): action is RefreshAction => {
  return (action as RefreshAction).type === TYPE_REFRESH_STORE;
};
