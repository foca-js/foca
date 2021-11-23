import { Action } from 'redux';

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
  state: State;
}
