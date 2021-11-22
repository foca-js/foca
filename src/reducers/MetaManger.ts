import { AnyAction, Store } from 'redux';
import { customImmer, ReducerManager } from './ReducerManager';
import { MetaAction, MetaStateItem } from '../actions/meta';
import type { PromiseEffect } from '../model/EffectManager';
import { resolveMetaCategory } from '../utils/resolveMetaCategory';

interface State {
  [model: string]: {
    [method: string]: {
      [id: string]: MetaStateItem;
    };
  };
}

export class MetaManager extends ReducerManager<State> {
  protected status: Record<string, boolean> = {};

  constructor(protected readonly store: Store) {
    super({
      name: '_metas_',
      initialState: {},
      preventRefresh: false,
    });
  }

  public get(effect: PromiseEffect): Partial<MetaStateItem> {
    const {
      _: { model, method },
    } = effect;

    let meta: MetaStateItem | undefined;

    if (this.isActive(model, method)) {
      const metas: State = this.store.getState()[this.name];
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
      const { model, method, payload, category } = action;

      if (this.isActive(model, method)) {
        return customImmer.produce(state, (draft) => {
          ((draft[model] ||= {})[method] ||= {})[
            resolveMetaCategory(category)
          ] = this.freeze(payload);
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
