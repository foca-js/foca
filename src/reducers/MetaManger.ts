import { AnyAction } from 'redux';
import assign from 'object-assign';
import { store } from '../store/StoreAdvanced';
import { ReducerManager } from './ReducerManager';
import { MetaAction, MetaStateItem } from '../actions/meta';

interface State {
  [model: string]: {
    [method: string]: MetaStateItem;
  };
}

class MetaManager extends ReducerManager<State> {
  protected status: Record<string, boolean> = {};

  constructor() {
    super({
      name: '_metas_',
      initial: {},
      preventRefresh: false,
    });
    store.appendReducer(this);
  }

  public get(model: string, method: string): Partial<MetaStateItem> {
    let meta: MetaStateItem | undefined;

    if (this.isActive(model, method)) {
      const metas: State = store.getState()[this.name];
      meta = metas && metas[model] && metas[model]![method];
    } else {
      this.activate(model, method);
    }

    return meta || {};
  }

  override consumer(state: State | undefined, action: AnyAction) {
    if (state === void 0) {
      return this.initial;
    }

    if (this.isMeta(action)) {
      const { model, method, payload } = action;

      if (this.isActive(model, method)) {
        return assign({}, state, {
          [model]: assign({}, state[model], {
            [method]: payload,
          }),
        });
      }

      return state;
    }

    if (this.isRefresh(action)) {
      return this.initial;
    }

    return state;
  }

  protected isActive(model: string, method: string): boolean {
    return this.status[model + '|' + method] === true;
  }

  protected activate(model: string, method: string) {
    this.status[model + '|' + method] = true;
  }

  protected isMeta(action: AnyAction): action is MetaAction {
    return (action as MetaAction).setMeta === true;
  }
}

export const metaManager = new MetaManager();
