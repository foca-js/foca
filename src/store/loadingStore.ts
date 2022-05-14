import {
  AnyAction,
  applyMiddleware,
  legacy_createStore as createStore,
  Store,
} from 'redux';
import type { PromiseRoomEffect, PromiseEffect } from '../model/enhanceEffect';
import { loadingInterceptor } from '../middleware/loadingInterceptor';
import { isLoadingAction } from '../actions/loading';
import { freezeState } from '../utils/freezeState';
import { actionRefresh, isRefreshAction } from '../actions/refresh';
import { combine } from './proxyStore';

export interface FindLoading {
  find(category: number | string): boolean;
}

interface LoadingState extends FindLoading {
  data: {
    [category: string]: boolean;
  };
}

interface LoadingStoreStateItem {
  loadings: LoadingState;
}

export type LoadingStoreState = {
  [model_method: string]: LoadingStoreStateItem;
};

const findLoading: FindLoading['find'] = function (
  this: LoadingState,
  category,
) {
  return !!this.data[category];
};

const createDefaultRecord = (): LoadingStoreStateItem => {
  return {
    loadings: {
      find: findLoading,
      data: {},
    },
  };
};

const defaultRecord = freezeState(createDefaultRecord());

const helper = {
  status: <Record<string, boolean>>{},

  get(effect: PromiseEffect | PromiseRoomEffect): LoadingStoreStateItem {
    const {
      _: { model, method },
    } = effect;
    let record: LoadingStoreStateItem | undefined;
    const combineKey = this.keyOf(model, method);

    if (this.isActive(combineKey)) {
      record = loadingStore.getState()[combineKey];
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

  keyOf(model: string, method: string) {
    return model + '.' + method;
  },

  refresh() {
    return loadingStore.dispatch(actionRefresh(true));
  },
};

export const loadingStore = createStore(
  (state: LoadingStoreState = {}, action: AnyAction): LoadingStoreState => {
    if (isLoadingAction(action)) {
      const {
        model,
        method,
        payload: { category, loading },
      } = action;
      const key = helper.keyOf(model, method);
      // immer处理大对象时性能较差，不如直接浅复制
      const next = Object.assign({}, state);
      const record = (next[key] = Object.assign(
        {},
        next[key] || createDefaultRecord(),
      ));
      const loadings = (record.loadings = Object.assign({}, record.loadings));
      loadings.data = Object.assign({}, loadings.data, {
        [category]: loading,
      });

      freezeState(loadings);
      return next;
    }

    if (isRefreshAction(action)) {
      return {};
    }

    return state;
  },
  applyMiddleware(loadingInterceptor(helper)),
) as Store<LoadingStoreState> & { helper: typeof helper };

combine(loadingStore);

loadingStore.helper = helper;
