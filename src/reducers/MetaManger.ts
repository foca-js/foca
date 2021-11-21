import { AnyAction } from 'redux';
import { store } from '../store/StoreAdvanced';
import { customImmer, ReducerManager } from './ReducerManager';
import { MetaAction, MetaStateItem } from '../actions/meta';
import type { PromiseEffect } from '../model/EffectManager';
import { getMetaId } from '../utils/getMetaId';

interface State {
  [model: string]: {
    [method: string]: {
      [id: string]: MetaStateItem;
    };
  };
}

class MetaManager extends ReducerManager<State> {
  protected status: Record<string, boolean> = {};

  constructor() {
    super({
      name: '_metas_',
      initialState: {},
      preventRefresh: false,
    });
    store.appendReducer(this);
  }

  public get(effect: PromiseEffect): Partial<MetaStateItem> {
    const {
      _: { model, method },
    } = effect;

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
      state = this.initialState;
    }

    if (this.isMeta(action)) {
      const { model, method, payload, metaId } = action;

      if (this.isActive(model, method)) {
        return customImmer.produce(state, (draft) => {
          ((draft[model] ||= {})[method] ||= {})[getMetaId(metaId)] =
            this.freeze(payload);
        });
      }

      return state;
    }

    if (this.isRefresh(action)) {
      return this.initialState;
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
