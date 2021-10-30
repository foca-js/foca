import { AnyAction } from 'redux';
import { store, StoreAdvanced } from '../store/StoreAdvanced';
import { DispatchAction } from '../model/ActionManager';
import { MetaAction } from '../model/EffectManager';
import { ReducerManager } from './ReducerManager';

export interface Meta {
  message?: string;
}

export interface MetaStateItem extends Meta {
  loading: boolean;
}

const ACTION_TYPE_HYDRATE_META = '@@meta.hydrate';

type Status = 'untracked' | 'pending' | 'using';

interface Stash {
  [model_method: string]: MetaStateItem | undefined;
}

interface State {
  [model: string]: {
    [method: string]: MetaStateItem;
  };
}

interface HydrateMetaAction extends DispatchAction {
  type: typeof ACTION_TYPE_HYDRATE_META;
  model: string;
  method: string;
}

class MetaManager extends ReducerManager<State> {
  protected stash: Stash = {};
  protected status: Record<string, Status> = {};

  constructor() {
    super({
      name: '_metas_',
      initial: {},
      keepStateFromRefresh: false,
    });
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
              type: ACTION_TYPE_HYDRATE_META,
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

    if (this.isMetaAction(action)) {
      const { model, method, payload } = action;

      if (this.getStatus(model, method) === 'using') {
        return {
          ...state,
          [model]: {
            ...state[model],
            [method]: payload,
          },
        };
      }

      return this.setStash(model, method, payload), state;
    }

    if (this.isRestoreMeta(action)) {
      const { model, method } = action;
      const stash = this.getStash(model, method);

      this.setStatus(model, method, 'using');
      this.setStash(model, method, undefined);

      return stash
        ? {
            ...state,
            [model]: {
              ...state[model],
              [method]: stash,
            },
          }
        : state;
    }

    if (this.isRefreshAction(action)) {
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

  protected setStash(model: string, method: string, value: MetaStateItem | undefined) {
    this.stash[model + '|' + method] = value;
  }

  protected isRestoreMeta(action: AnyAction): action is HydrateMetaAction {
    return action.type === ACTION_TYPE_HYDRATE_META;
  }

  protected isMetaAction(action: AnyAction): action is MetaAction {
    return (action as MetaAction).setMeta === true;
  }
}

export const metaManager = new MetaManager();

StoreAdvanced.appendReducer(metaManager);
