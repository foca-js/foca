import type { UnknownAction } from 'redux';

export const TYPE_SET_LOADING = '@@store/loading';

export const LOADING_CATEGORY = '##' + Math.random();

export const DESTROY_LOADING = TYPE_SET_LOADING + '/destroy';

export interface LoadingAction extends UnknownAction {
  type: typeof TYPE_SET_LOADING;
  model: string;
  method: string;
  payload: {
    loading: boolean;
    category: string | number;
  };
}

export const isLoadingAction = (
  action: UnknownAction | unknown,
): action is LoadingAction => {
  const tester = action as LoadingAction;
  return (
    tester.type === TYPE_SET_LOADING &&
    !!tester.model &&
    !!tester.method &&
    !!tester.payload
  );
};

export interface DestroyLoadingAction extends UnknownAction {
  type: typeof DESTROY_LOADING;
  model: string;
}

export const isDestroyLoadingAction = (
  action: UnknownAction | unknown,
): action is DestroyLoadingAction => {
  const tester = action as DestroyLoadingAction;
  return tester.type === DESTROY_LOADING && !!tester.model;
};
