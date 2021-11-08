import { Action } from 'redux';

export interface DispatchAction<State extends object = object, Payload = object>
  extends Action<string> {
  model: string;
  method: string;
  payload: Payload;
  consumer?(state: State, action: DispatchAction<State, Payload>): State | void;
}
