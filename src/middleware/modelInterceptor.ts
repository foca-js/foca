import deepEqual from 'fast-deep-equal';
import { AnyAction, Middleware } from 'redux';
import { PostModelAction, PreModelAction } from '../actions/model';
import { getImmer } from '../utils/getImmer';

const isPreModelAction = (action: AnyAction): action is PreModelAction => {
  const test = action as PreModelAction;

  return (
    test.preModel === true &&
    !!test.model &&
    typeof test.consumer === 'function'
  );
};

const immer = getImmer();

export const modelInterceptor: Middleware<{}, Record<string, object>> =
  (api) => (dispatch) => (action: AnyAction) => {
    if (!isPreModelAction(action)) {
      return dispatch(action);
    }

    const prev = api.getState()[action.model]!;
    const next = immer.produce(prev, (draft) => {
      return action.consumer(draft, action);
    });

    if (deepEqual(prev, next)) {
      return action;
    }

    return dispatch<PostModelAction>({
      type: action.type,
      model: action.model,
      postModel: true,
      next: next,
    });
  };
