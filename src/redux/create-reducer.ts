import type { Reducer } from 'redux';
import { isPostModelAction } from '../actions/model';
import { isRefreshAction } from '../actions/refresh';

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
  const initialState = options.initialState;

  return function reducer(state, action) {
    if (state === void 0) return initialState;

    if (isPostModelAction<State>(action) && action.model === reducerName) {
      return action.next;
    }

    if (isRefreshAction(action) && (allowRefresh || action.payload.force)) {
      return initialState;
    }

    return state;
  };
};
