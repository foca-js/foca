import type { Action, AnyAction } from 'redux';

export const TYPE_SET_LOADING = '@@store/loading';

export const LOADING_CATEGORY = '##' + Math.random();

export const DESTROY_LOADING = TYPE_SET_LOADING + '/destroy';

export interface LoadingAction extends Action<typeof TYPE_SET_LOADING> {
  model: string;
  method: string;
  payload: {
    loading: boolean;
    category: string | number;
  };
}

export const isLoadingAction = (action: AnyAction): action is LoadingAction => {
  const tester = action as LoadingAction;
  return (
    tester.type === TYPE_SET_LOADING &&
    !!tester.model &&
    !!tester.method &&
    !!tester.payload
  );
};

export interface DestroyLoadingAction extends Action<typeof DESTROY_LOADING> {
  model: string;
}

export const isDestroyLoadingAction = (
  action: AnyAction,
): action is DestroyLoadingAction => {
  const tester = action as DestroyLoadingAction;
  return tester.type === DESTROY_LOADING && !!tester.model;
};
