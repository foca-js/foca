import type { AnyAction } from 'redux';
import { enableES5, enableMapSet, freeze, Immer } from 'immer';
import isEqual from 'lodash.isequal';
import { TYPE_REFRESH_STORE, RefreshAction } from '../actions/refresh';
import { DispatchAction } from '../actions/dispatch';
import { isCrushed } from '../utils/isCrushed';

const DEV = !isCrushed();

const immer = new Immer({
  autoFreeze: false,
});

/**
 * support for the fallback implementation has to be explicitly enabled
 * @link https://immerjs.github.io/immer/docs/installation#pick-your-immer-version
 * @since immer 6.0
 */
enableES5(), enableMapSet();

interface Options<State extends object> {
  readonly name: string;
  readonly initialState: State;
  readonly preventRefresh: boolean;
}

export class ReducerManager<State extends object> {
  public readonly name: string;
  protected readonly initialState: State;
  protected readonly preventRefresh: boolean;

  constructor(options: Options<State>) {
    this.name = options.name;
    this.initialState = this.freeze(options.initialState);
    this.preventRefresh = options.preventRefresh;
  }

  consumer(state: State | undefined, action: AnyAction) {
    if (state === void 0) {
      return this.initialState;
    }

    if (this.isSelfModel(action)) {
      return action.consumer
        ? this.execute(state, action, action.consumer)
        : state;
    }

    if (this.isRefresh(action)) {
      return action.payload.force || !this.preventRefresh
        ? this.initialState
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
    const next = immer.produce(state, (draft) => {
      return consumer(draft as State, action) as typeof draft | void;
    });

    return isEqual(state, next) ? state : this.freeze(next);
  }

  protected freeze(state: any) {
    return DEV ? freeze(state, true) : state;
  }
}
