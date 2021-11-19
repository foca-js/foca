import type { AnyAction } from 'redux';
import { enableES5, enableMapSet, Immer, isDraft } from 'immer';
import isEqual from 'lodash.isequal';
import { TYPE_REFRESH_STORE, RefreshAction } from '../actions/refresh';
import { DispatchAction } from '../actions/dispatch';

const immer = new Immer({
  autoFreeze: process.env.NODE_ENV !== 'production',
});

/**
 * support for the fallback implementation has to be explicitly enabled
 * @link https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
 * @since immer 6.0
 */
enableES5(), enableMapSet();

interface Options<State extends object> {
  readonly name: string;
  readonly initial: State;
  readonly preventRefresh: boolean;
}

export class ReducerManager<State extends object> {
  public readonly name: string;
  protected readonly initial: State;
  protected readonly preventRefresh: boolean;

  constructor(options: Options<State>) {
    this.name = options.name;
    this.initial = options.initial;
    this.preventRefresh = options.preventRefresh;
  }

  consumer(state: State | undefined, action: AnyAction) {
    if (state === void 0) {
      return this.initial;
    }

    if (this.isSelfModel(action)) {
      return action.consumer
        ? this.execute(state, action, action.consumer)
        : state;
    }

    if (this.isRefresh(action)) {
      return action.payload.force || !this.preventRefresh
        ? this.initial
        : state;
    }

    return state;
  }

  protected isSelfModel(action: AnyAction): action is DispatchAction<State> {
    type CustomAction = DispatchAction<State>;

    return (
      (action as CustomAction).model === this.name &&
      typeof (action as CustomAction).consumer === 'function'
    );
  }

  protected isRefresh(action: AnyAction): action is RefreshAction {
    return (action as RefreshAction).type === TYPE_REFRESH_STORE;
  }

  protected execute(
    state: State,
    action: DispatchAction<State>,
    consumer: NonNullable<DispatchAction<State>['consumer']>,
  ): State {
    const draft = immer.createDraft(state);
    let next = consumer(draft as State, action);

    if (next === void 0) {
      next = immer.finishDraft(draft) as State;
    } else if (isDraft(next)) {
      next = immer.finishDraft(next) as State;
    }

    return isEqual(state, next) ? state : next;
  }
}
