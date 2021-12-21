import type { Action, AnyAction } from 'redux';

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

  return (
    test.preModel === true &&
    !!test.model &&
    typeof test.consumer === 'function'
  );
};

export const isPostModel = <State extends object>(
  action: AnyAction,
): action is PostModelAction<State> => {
  const test = action as PostModelAction<State>;
  return test.postModel === true && !!test.next;
};
