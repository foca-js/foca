import type { Action, AnyAction } from 'redux';
import { isFunction } from '../utils/isType';

export interface PreModelAction<State extends object = object, Payload = object>
  extends Action<string> {
  model: string;
  preModel: true;
  payload: Payload;
  consumer(state: State, action: PreModelAction<State, Payload>): State | void;
}

export interface PostModelAction<State = object> extends Action<string> {
  model: string;
  postModel: true;
  next: State;
}

export const isPreModelAction = (
  action: AnyAction,
): action is PreModelAction => {
  const test = action as PreModelAction;
  return test.preModel && !!test.model && isFunction(test.consumer);
};

export const isPostModelAction = <State extends object>(
  action: AnyAction,
): action is PostModelAction<State> => {
  const test = action as PostModelAction<State>;
  return test.postModel && !!test.next;
};
