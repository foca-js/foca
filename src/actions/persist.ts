import type { AnyAction } from 'redux';

const TYPE_PERSIST_HYDRATE = '@@persist/hydrate';

export interface PersistHydrateAction {
  type: typeof TYPE_PERSIST_HYDRATE;
  payload: Record<string, object>;
}

export const actionHydrate = (
  states: Record<string, object>,
): PersistHydrateAction => {
  return {
    type: TYPE_PERSIST_HYDRATE,
    payload: states,
  };
};

export const isHydrateAction = (
  action: AnyAction,
): action is PersistHydrateAction => {
  return (action as PersistHydrateAction).type === TYPE_PERSIST_HYDRATE;
};
