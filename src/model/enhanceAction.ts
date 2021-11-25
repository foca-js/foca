import { PreModelAction } from '../actions/model';
import { modelStore } from '../store/modelStore';
import { toArgs } from '../utils/toArgs';
import type { ActionCtx } from './defineModel';

export interface EnhancedAction<State extends object> {
  (payload: any): PreModelAction<State>;
}

export const enhanceAction = <State extends object>(
  ctx: ActionCtx<State>,
  actionName: string,
  consumer: (state: State, ...args: any[]) => any,
): EnhancedAction<State> => {
  const actionType = ctx.name + '.' + actionName;

  const enhancedConsumer: PreModelAction<State, any[]>['consumer'] = (
    state,
    action,
  ) => {
    return consumer.apply(
      ctx,
      [state].concat(action.payload) as [state: State, ...args: any[]],
    );
  };

  const fn: EnhancedAction<State> = function () {
    return modelStore.dispatch<PreModelAction<State, any[]>>({
      type: actionType,
      model: ctx.name,
      preModel: true,
      payload: toArgs(arguments),
      consumer: enhancedConsumer,
    });
  };

  return fn;
};
