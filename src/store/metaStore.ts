import { AnyAction, applyMiddleware, createStore, Store } from 'redux';
import type { PromiseEffect } from '../model/enhanceEffect';
import { metaInterceptor } from '../middleware/metaInterceptor';
import type { MetaAction, MetaStateItem } from '../actions/meta';
import { isRefreshAction } from '../utils/isRefreshAction';
import { freezeState } from '../utils/freezeState';
import { metaKey } from '../utils/metaKey';
import { getImmer } from '../utils/getImmer';
import { RefreshAction, TYPE_REFRESH_STORE } from '../actions/refresh';

export interface PickMeta {
  pick(category: number | string): Partial<MetaStateItem>;
}

export interface PickLoading {
  pick(category: number | string): boolean;
}

interface MetaState extends PickMeta {
  data: {
    [category: string]: MetaStateItem;
  };
}

interface LoadingState extends PickLoading {
  data: {
    [category: string]: boolean;
  };
}

interface MetaStoreStateItem {
  metas: MetaState;
  loadings: LoadingState;
}

export type MetaStoreState = {
  [model_method: string]: MetaStoreStateItem;
};

const pickMeta: PickMeta['pick'] = function (
  this: MetaState,
  category: number | string,
) {
  return this.data[metaKey(category)] || {};
};

const pickLoading: PickLoading['pick'] = function (
  this: LoadingState,
  category: number | string,
) {
  return !!this.data[metaKey(category)];
};

const createDefaultRecord = (): MetaStoreStateItem => {
  return {
    metas: {
      pick: pickMeta,
      data: {},
    },
    loadings: {
      pick: pickLoading,
      data: {},
    },
  };
};

const defaultRecord = freezeState(createDefaultRecord());

const helper = {
  status: <Record<string, boolean>>{},

  get(effect: PromiseEffect): MetaStoreStateItem {
    const {
      _: { model, method },
    } = effect;
    let record: MetaStoreStateItem | undefined;

    if (this.isActive(model, method)) {
      record = metaStore.getState()[this.key(model, method)];
    } else {
      this.activate(model, method);
    }

    return record || defaultRecord;
  },

  isActive(model: string, method: string): boolean {
    return this.status[this.key(model, method)] === true;
  },
  activate(model: string, method: string) {
    this.status[this.key(model, method)] = true;
  },
  inactivate(model: string, method: string) {
    this.status[this.key(model, method)] = false;
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

  key(model: string, method: string) {
    return model + '|' + method;
  },
};

const immer = getImmer();

export const metaStore = createStore(
  (state: MetaStoreState = {}, action: AnyAction): MetaStoreState => {
    if (helper.isMeta(action)) {
      const { model, method, payload } = action;
      const category = metaKey(action.category);

      return immer.produce(state, (draft) => {
        const { metas, loadings } = (draft[helper.key(model, method)] ||=
          createDefaultRecord());

        metas.data[category] = freezeState(payload);
        loadings.data[category] = payload.type === 'pending';
      });
    }

    if (isRefreshAction(action)) {
      return {};
    }

    return state;
  },
  applyMiddleware(metaInterceptor(helper)),
) as Store<MetaStoreState> & { helper: typeof helper };

metaStore.helper = helper;
