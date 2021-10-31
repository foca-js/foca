export const TYPE_PERSIST_HYDRATE = '@@persist/hydrate';

export interface PersistHydrateAction {
  type: typeof TYPE_PERSIST_HYDRATE;
  payload: Record<string, object>;
}
