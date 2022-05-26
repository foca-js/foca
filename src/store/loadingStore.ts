import {
  AnyAction,
  applyMiddleware,
  legacy_createStore as createStore,
  Store,
} from 'redux';
import type { PromiseRoomEffect, PromiseEffect } from '../model/enhanceEffect';
import { loadingInterceptor } from '../middleware/loadingInterceptor';
import { isDestroyLoadingAction, isLoadingAction } from '../actions/loading';
import { freezeState } from '../utils/freezeState';
import { actionRefresh, isRefreshAction } from '../actions/refresh';
import { combine } from './proxyStore';
import { destroyLoadingInterceptor } from '../middleware/destroyLoadingInterceptor';
import { immer } from '../utils/immer';

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

export type LoadingStoreState = Partial<{
  [model: string]: Partial<{
    [method: string]: LoadingStoreStateItem;
  }>;
}>;

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
      record = loadingStore.getState()[model]?.[method];
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
  (
    state: LoadingStoreState | undefined,
    action: AnyAction,
  ): LoadingStoreState => {
    if (state === void 0) state = {};

    if (isLoadingAction(action)) {
      const {
        model,
        method,
        payload: { category, loading },
      } = action;
      const next = immer.produce(state, (draft) => {
        draft[model] ||= {};
        const { loadings } = (draft[model]![method] ||= createDefaultRecord());
        loadings.data[category] = loading;
      });

      freezeState(next[model]![method]!.loadings);
      return next;
    }

    if (isDestroyLoadingAction(action)) {
      const next = Object.assign({}, state);
      delete next[action.model];
      return next;
    }

    if (isRefreshAction(action)) {
      return {};
    }

    return state;
  },
  applyMiddleware(loadingInterceptor(helper), destroyLoadingInterceptor),
) as Store<LoadingStoreState> & { helper: typeof helper };

combine(loadingStore);

loadingStore.helper = helper;
