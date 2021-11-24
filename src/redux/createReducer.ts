import type { AnyAction, Reducer } from 'redux';
import { PostModelAction } from '../actions/model';
import { freezeState } from '../utils/freezeState';
import { isRefreshAction } from '../utils/isRefreshAction';

interface Options<State extends object> {
  readonly name: string;
  readonly initialState: State;
  readonly allowRefresh: boolean;
}

export const createReducer = <State extends object>(
  options: Options<State>,
): Reducer<State> => {
  const allowRefresh = options.allowRefresh;
  const reducerName = options.name;
  const initialState = freezeState(options.initialState);

  return function reducer(state, action) {
    if (state === void 0) {
      return initialState;
    }

    if (isPostModel<State>(action) && action.model === reducerName) {
      return action.next;
    }

    if (isRefreshAction(action) && (allowRefresh || action.payload.force)) {
      return initialState;
    }

    return state;
  };
};

const isPostModel = <State extends object>(
  action: AnyAction,
): action is PostModelAction<State> => {
  const test = action as PostModelAction<State>;
  return test.postModel === true && !!test.next;
};
