import { Action } from 'redux';
import { store } from '../store/StoreAdvanced';
import type { ActionCtx } from './defineModel';

export interface DispatchAction<State extends object = object, Payload = object>
  extends Action<string> {
  model: string;
  method: string;
  payload: Payload;
  consumer?(state: State, action: DispatchAction<State, Payload>): State | void;
}

export class ActionManager<State extends object> {
  protected readonly actionType: string;

  constructor(
    protected ctx: ActionCtx<State>,
    protected actionName: string,
    protected fn: (state: State, ...args: any[]) => any,
  ) {
    this.actionType = ctx.name + '.' + actionName;
  }

  execute(args: any[]) {
    return store.dispatch<DispatchAction<State, any[]>>({
      model: this.ctx.name,
      method: this.actionName,
      type: this.actionType,
      payload: args,
      consumer: (state, action) => {
        return this.fn.apply(
          this.ctx,
          [state].concat(action.payload) as [state: State, ...args: any[]],
        );
      },
    });
  }
}

export interface WrapAction<State extends object> {
  (payload: any): DispatchAction<State>;
  _$action: ActionManager<State>;
}

const slice = Array.prototype.slice;

export const wrapAction = <State extends object>(
  ctx: ActionCtx<State>,
  actionName: string,
  action: (state: State, ...args: any[]) => any,
): WrapAction<State> => {
  const manager = new ActionManager(ctx, actionName, action);
  const fn: WrapAction<State> = function () {
    return manager.execute(slice.call(arguments));
  };

  fn._$action = manager;

  return fn;
};
