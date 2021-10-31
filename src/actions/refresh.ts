export const TYPE_REFRESH_STORE = '@@store/refresh';

export interface RefreshAction {
  type: typeof TYPE_REFRESH_STORE;
  payload: {
    force: boolean;
  };
}
