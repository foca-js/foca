import {
  AnyAction,
  applyMiddleware,
  createStore,
  DeepPartial,
  Store,
} from 'redux';
import type { PromiseEffect } from '../model/enhanceEffect';
import { metaInterceptor } from '../middleware/metaInterceptor';
import type { MetaAction, MetaStateItem } from '../actions/meta';
import { isRefreshAction } from '../utils/isRefreshAction';
import { freezeState } from '../utils/freezeState';
import { resolveMetaCategory } from '../utils/resolveMetaCategory';
import { getImmer } from '../utils/getImmer';
import { RefreshAction, TYPE_REFRESH_STORE } from '../actions/refresh';

export type MetaState = DeepPartial<{
  [model: string]: {
    [method: string]: {
      [category: string]: MetaStateItem;
    };
  };
}>;

const immer = getImmer();

const helper = {
  status: <Record<string, boolean>>{},

  get(effect: PromiseEffect) {
    const {
      _: { model, method },
    } = effect;
    let meta: MetaStateItem | undefined;

    if (this.isActive(model, method)) {
      const state = metaStore.getState()[model];
      meta = state && state[method];
    } else {
      this.activate(model, method);
    }

    return meta || {};
  },

  isActive(model: string, method: string): boolean {
    return this.status[model + '|' + method] === true;
  },
  activate(model: string, method: string) {
    this.status[model + '|' + method] = true;
  },
  inactivate(model: string, method: string) {
    this.status[model + '|' + method] = false;
  },

  isMeta(action: AnyAction): action is MetaAction {
    const test = action as MetaAction;

    return (
      test.setMeta === true && !!test.model && !!test.method && !!test.category
    );
  },

  refresh() {
    return metaStore.dispatch<RefreshAction>({
      type: TYPE_REFRESH_STORE,
      payload: {
        force: true,
      },
    });
  },
};

export const metaStore = createStore(
  (state: MetaState | undefined, action: AnyAction) => {
    if (state === void 0) {
      return {};
    }

    if (helper.isMeta(action)) {
      const { model, method, payload } = action;
      const category = resolveMetaCategory(action.category);

      return immer.produce(state, (draft) => {
        ((draft[model] ||= {})[method] ||= {})[category] = freezeState(payload);
      });
    }

    if (isRefreshAction(action)) {
      return {};
    }

    return state;
  },
  applyMiddleware(metaInterceptor(helper)),
) as Store<MetaState> & { helper: typeof helper };

metaStore.helper = helper;
