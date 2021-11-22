import { DispatchAction } from '../actions/dispatch';
import { modelStore } from '../store/modelStore';
import { toArgs } from '../utils/toArgs';
import type { ActionCtx } from './defineModel';

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
    return modelStore.dispatch<DispatchAction<State, any[]>>({
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

export const wrapAction = <State extends object>(
  ctx: ActionCtx<State>,
  actionName: string,
  action: (state: State, ...args: any[]) => any,
): WrapAction<State> => {
  const manager = new ActionManager(ctx, actionName, action);
  const fn: WrapAction<State> = function () {
    return manager.execute(toArgs(arguments));
  };

  fn._$action = manager;

  return fn;
};
