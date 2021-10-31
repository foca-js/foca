export const ACTION_TYPE_REFRESH_STORE = '@@store/refresh';

export interface RefreshAction {
  type: typeof ACTION_TYPE_REFRESH_STORE;
  payload: {
    force: boolean;
  };
}
