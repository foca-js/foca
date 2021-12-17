import { Action, AnyAction } from 'redux';

export const TYPE_SET_LOADING = '@@store/loading';

export const LOADING_CATEGORY = '##' + Math.random();

export interface LoadingAction extends Action<typeof TYPE_SET_LOADING> {
  model: string;
  method: string;
  payload: {
    loading: boolean;
    category: string | number;
  };
}

export const isLoadingAction = (action: AnyAction): action is LoadingAction => {
  const test = action as LoadingAction;
  return (
    test.type === TYPE_SET_LOADING &&
    !!test.model &&
    !!test.method &&
    !!test.payload
  );
};
