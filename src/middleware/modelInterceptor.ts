import isEqual from 'lodash.isequal';
import { AnyAction, Middleware } from 'redux';
import { PostModelAction, PreModelAction } from '../actions/model';
import { freezeState } from '../utils/freezeState';
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

export const modelInterceptor: Middleware =
  (api) => (dispatch) => (action: AnyAction) => {
    if (!isPreModelAction(action)) {
      return dispatch(action);
    }

    const prev = api.getState()[action.model] as object;
    const next = immer.produce(prev, (draft) => {
      return action.consumer(draft, action) as typeof draft | void;
    });

    if (isEqual(prev, next)) {
      return;
    }

    return dispatch<PostModelAction>({
      type: action.type,
      model: action.model,
      postModel: true,
      next: freezeState(next),
    });
  };
