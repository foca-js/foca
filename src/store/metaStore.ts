import { AnyAction, applyMiddleware, createStore, Store } from 'redux';
import type { PromiseEffect } from '../model/enhanceEffect';
import { metaInterceptor } from '../middleware/metaInterceptor';
import type { MetaAction, MetaStateItem } from '../actions/meta';
import { isRefreshAction } from '../utils/isRefreshAction';
import { freezeState } from '../utils/freezeState';
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

const undeclaredMeta = freezeState({});

const pickMeta: PickMeta['pick'] = function (this: MetaState, category) {
  return this.data[category] || undeclaredMeta;
};

const pickLoading: PickLoading['pick'] = function (
  this: LoadingState,
  category,
) {
  return !!this.data[category];
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
    const combineKey = this.keyOf(model, method);

    if (this.isActive(combineKey)) {
      record = metaStore.getState()[combineKey];
    } else {
      this.activate(combineKey);
    }

    return record || defaultRecord;
  },

  isActive(key: string): boolean {
    return this.status[key] === true;
  },
  activate(key: string) {
    this.status[key] = true;
  },
  inactivate(key: string) {
    this.status[key] = false;
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

  keyOf(model: string, method: string) {
    return model + '.' + method;
  },
};

const immer = getImmer();

export const metaStore = createStore(
  (state: MetaStoreState = {}, action: AnyAction): MetaStoreState => {
    if (helper.isMeta(action)) {
      const { model, method, payload, category } = action;
      const combineKey = helper.keyOf(model, method);
      const next = immer.produce(state, (draft) => {
        const { metas, loadings } = (draft[combineKey] ||=
          createDefaultRecord());

        metas.data[category] = payload;
        loadings.data[category] = payload.type === 'pending';
      });

      freezeState(next[combineKey]!.metas);
      freezeState(next[combineKey]!.loadings);
      return next;
    }

    if (isRefreshAction(action)) {
      return {};
    }

    return state;
  },
  applyMiddleware(metaInterceptor(helper)),
) as Store<MetaStoreState> & { helper: typeof helper };

metaStore.helper = helper;
