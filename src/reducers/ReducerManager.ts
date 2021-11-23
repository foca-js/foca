import type { AnyAction } from 'redux';
import { PostModelAction } from '../actions/model';
import { freezeState } from '../utils/freezeState';
import { isRefreshAction } from '../utils/isRefreshAction';

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
    this.initialState = freezeState(options.initialState);
    this.preventRefresh = options.preventRefresh;
  }

  consumer(state: State | undefined, action: AnyAction) {
    if (state === void 0) {
      return this.initialState;
    }

    if (this.isSelfModel(action)) {
      return freezeState(action.state);
    }

    if (isRefreshAction(action)) {
      return action.payload.force || !this.preventRefresh
        ? this.initialState
        : state;
    }

    return state;
  }

  protected isSelfModel(action: AnyAction): action is PostModelAction<State> {
    const test = action as PostModelAction<State>;
    return test.postModel === true && test.model === this.name && !!test.state;
  }
}
