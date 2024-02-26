import type { Middleware } from 'redux';
import { deepEqual } from '../utils/deep-equal';
import { isPreModelAction, PostModelAction } from '../actions/model';
import { immer } from '../utils/immer';

export const modelInterceptor: Middleware<{}, Record<string, object>> =
  (api) => (dispatch) => (action) => {
    if (!isPreModelAction(action)) {
      return dispatch(action);
    }

    const prev = api.getState()[action.model]!;
    const next = immer.produce(prev, (draft) => {
      return action.consumer(draft, action);
    });

    action.actionInActionGuard && action.actionInActionGuard();

    if (deepEqual(prev, next)) return action;

    return dispatch({
      type: action.type,
      model: action.model,
      postModel: true,
      next: next,
    } satisfies PostModelAction);
  };
