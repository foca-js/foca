import isEqual from 'lodash.isequal';
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

export const modelInterceptor: Middleware =
  (api) => (dispatch) => (action: AnyAction) => {
    if (!isPreModelAction(action)) {
      return dispatch(action);
    }

    const prev = api.getState()[action.model] as object;

    if (prev === void 0) {
      return dispatch(action);
    }

    const next = immer.produce(prev, (draft) => {
      return action.consumer(draft, action) as typeof draft | void;
    });

    if (!isEqual(prev, next)) {
      return dispatch<PostModelAction>({
        type: action.type,
        model: action.model,
        postModel: true,
        state: next,
      });
    }

    return;
  };
