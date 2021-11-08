import { AnyAction } from 'redux';
import { store } from '../store/StoreAdvanced';
import assign from 'object-assign';
import { ReducerManager } from './ReducerManager';
import {
  HydrateMetaAction,
  MetaAction,
  MetaStateItem,
  TYPE_HYDRATE_META,
} from '../actions/meta';

type Status = 'untracked' | 'pending' | 'using';

interface Stash {
  [model_method: string]: MetaStateItem | undefined;
}

interface State {
  [model: string]: {
    [method: string]: MetaStateItem;
  };
}

class MetaManager extends ReducerManager<State> {
  protected stash: Stash = {};
  protected status: Record<string, Status> = {};

  constructor() {
    super({
      name: '_metas_',
      initial: {},
      preventRefresh: false,
    });
    store.appendReducer(this);
  }

  public getMeta(model: string, method: string): Partial<MetaStateItem> {
    let meta: MetaStateItem | undefined;

    switch (this.getStatus(model, method)) {
      case 'untracked':
        meta = this.getStash(model, method);

        if (meta) {
          this.setStatus(model, method, 'pending');
          // Using micro task to dispatch as soon as possible.
          Promise.resolve().then(() => {
            store.dispatch<HydrateMetaAction>({
              type: TYPE_HYDRATE_META,
              model,
              method,
              payload: {},
            });
          });
        } else {
          this.setStatus(model, method, 'using');
        }

        break;
      case 'pending':
        meta = this.getStash(model, method);
        break;
      case 'using':
        const metas: State = store.getState()[this.name];
        meta = metas && metas[model] && metas[model]![method];
        break;
    }

    return meta || {};
  }

  override consumer(state: State | undefined, action: AnyAction) {
    if (state === void 0) {
      return this.initial;
    }

    if (this.isMeta(action)) {
      const { model, method, payload } = action;

      if (this.getStatus(model, method) === 'using') {
        return assign({}, state, {
          [model]: assign({}, state[model], {
            [method]: payload,
          }),
        });
      }

      return this.setStash(model, method, payload), state;
    }

    if (this.isMetaHydrate(action)) {
      const { model, method } = action;
      const stash = this.getStash(model, method);

      this.setStatus(model, method, 'using');
      this.setStash(model, method, void 0);

      return stash
        ? assign({}, state, {
            [model]: assign({}, state[model], {
              [method]: stash,
            }),
          })
        : state;
    }

    if (this.isRefresh(action)) {
      this.stash = {};
      this.status = {};
      return this.initial;
    }

    return state;
  }

  protected getStatus(model: string, method: string): Status {
    return this.status[model + '|' + method] || 'untracked';
  }

  protected setStatus(model: string, method: string, status: Status) {
    this.status[model + '|' + method] = status;
  }

  protected getStash(model: string, method: string): MetaStateItem | undefined {
    return this.stash[model + '|' + method];
  }

  protected setStash(
    model: string,
    method: string,
    value: MetaStateItem | undefined,
  ) {
    this.stash[model + '|' + method] = value;
  }

  protected isMetaHydrate(action: AnyAction): action is HydrateMetaAction {
    return action.type === TYPE_HYDRATE_META;
  }

  protected isMeta(action: AnyAction): action is MetaAction {
    return (action as MetaAction).setMeta === true;
  }
}

export const metaManager = new MetaManager();
