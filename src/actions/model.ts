import type { Action, UnknownAction } from 'redux';
import { isFunction } from '../utils/is-type';

export interface PreModelAction<State extends object = object, Payload = object>
  extends UnknownAction,
    Action<string> {
  model: string;
  preModel: true;
  payload: Payload;
  actionInActionGuard?: () => void;
  consumer(state: State, action: PreModelAction<State, Payload>): State | void;
}

export interface PostModelAction<State = object>
  extends UnknownAction,
    Action<string> {
  model: string;
  postModel: true;
  next: State;
}

export const isPreModelAction = (
  action: UnknownAction | unknown,
): action is PreModelAction => {
  const test = action as PreModelAction;
  return test.preModel && !!test.model && isFunction(test.consumer);
};

export const isPostModelAction = <State extends object>(
  action: UnknownAction,
): action is PostModelAction<State> => {
  const test = action as PostModelAction<State>;
  return test.postModel && !!test.next;
};
