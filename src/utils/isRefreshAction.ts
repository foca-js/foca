import { AnyAction } from 'redux';
import { RefreshAction, TYPE_REFRESH_STORE } from '../actions/refresh';

export const isRefreshAction = (action: AnyAction): action is RefreshAction => {
  return (action as RefreshAction).type === TYPE_REFRESH_STORE;
};
