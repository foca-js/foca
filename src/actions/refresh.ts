export const ACTION_TYPE_REFRESH = '@@store/refresh';

export interface RefreshAction {
  type: typeof ACTION_TYPE_REFRESH;
  payload: {
    force: boolean;
  };
}
