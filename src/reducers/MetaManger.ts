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

const USED_FLAG = 'meta-used';
const ACTION_TYPE_RESTORE_META = '@@meta/restore';

interface MetaStash {
  [model: string]:
    | {
        [method: string]: MetaStateItem | typeof USED_FLAG | undefined;
      }
    | undefined;
}

interface State {
  [model: string]: {
    [method: string]: MetaStateItem;
  };
}

interface RestoreMetaAction extends DispatchAction {
  type: typeof ACTION_TYPE_RESTORE_META;
  model: string;
  method: string;
}

class MetaManager extends ReducerManager<State> {
  // All metas will be stored here before user need them.
  protected stash: MetaStash;
  protected pending: Record<string, boolean> = {};

  constructor() {
    super({
      name: '_metas_',
      initial: {},
      keepStateFromRefresh: false,
    });

    this.stash = {};
  }

  public getMeta(model: string, method: string): Partial<MetaStateItem> {
    const stashValue = this.getStash(model, method);
    let meta: MetaStateItem | undefined = store.getState()[this.name]?.[model]?.[method];

    if (!meta && stashValue && stashValue !== USED_FLAG) {
      // Using micro task to dispatch as soon as possible.

      if (!this.isPending(model, method)) {
        this.setPending(model, method);

        Promise.resolve().then(() => {
          store.dispatch<RestoreMetaAction>({
            type: ACTION_TYPE_RESTORE_META,
            model,
            method,
            payload: {},
          });
        });
      }

      meta = stashValue;
    }

    return meta || {};
  }

  override consumer(state: State | undefined, action: AnyAction) {
    if (state === void 0) {
      return this.initial;
    }

    if (this.isRestoreMeta(action)) {
      const { model, method } = action;
      const stashValue = this.getStash(model, method);

      this.setStash(model, method, USED_FLAG);

      if (!stashValue || stashValue === USED_FLAG) {
        return state;
      }

      return {
        ...state,
        [model]: {
          ...state[model],
          [method]: stashValue,
        },
      };
    }

    if (this.isMetaAction(action)) {
      const { model, method, payload } = action;
      const stashValue = this.getStash(model, method);

      if (stashValue === USED_FLAG) {
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

    if (this.isRefreshAction(action)) {
      this.stash = {};
      return this.initial;
    }

    return state;
  }

  protected isPending(model: string, method: string): boolean {
    return this.pending[model + '|' + method] === true;
  }

  protected setPending(model: string, method: string) {
    this.pending[model + '|' + method] = true;
  }

  protected getStash(model: string, method: string): MetaStateItem | typeof USED_FLAG | undefined {
    return this.stash[model] && this.stash[model]![method];
  }

  protected setStash(model: string, method: string, value: MetaStateItem | typeof USED_FLAG) {
    (this.stash[model] ||= {})[method] = value;
  }

  protected isRestoreMeta(action: AnyAction): action is RestoreMetaAction {
    return action.type === ACTION_TYPE_RESTORE_META;
  }

  protected isMetaAction(action: AnyAction): action is MetaAction {
    return (action as MetaAction).meta === true;
  }
}

export const metaManager = new MetaManager();

StoreAdvanced.appendReducer(metaManager);
