export const ACTION_TYPE_PERSIST_HYDRATE = '@@persist/hydrate';

export interface PersistHydrateAction {
  type: typeof ACTION_TYPE_PERSIST_HYDRATE;
  payload: Record<string, object>;
}
