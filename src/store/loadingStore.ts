import {
  AnyAction,
  applyMiddleware,
  legacy_createStore as createStore,
} from 'redux';
import type { PromiseRoomEffect, PromiseEffect } from '../model/enhanceEffect';
import { loadingInterceptor } from '../middleware/loadingInterceptor';
import { isDestroyLoadingAction, isLoadingAction } from '../actions/loading';
import { freezeState } from '../utils/freezeState';
import { actionRefresh, isRefreshAction } from '../actions/refresh';
import { combine } from './proxyStore';
import { destroyLoadingInterceptor } from '../middleware/destroyLoadingInterceptor';
import { immer } from '../utils/immer';
import { StoreBasic } from './StoreBasic';
import { modelStore } from './modelStore';

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

export class LoadingStore extends StoreBasic<LoadingStoreState> {
  protected status: Partial<{
    [model: string]: Partial<{
      [method: string]: boolean;
    }>;
  }> = {};
  protected defaultRecord = freezeState(createDefaultRecord());

  constructor() {
    super();
    const topic = modelStore.topic;
    topic.subscribe('init', this.init.bind(this));
    topic.subscribe('refresh', this.refresh.bind(this));
    topic.subscribe('unmount', this.unmount.bind(this));
  }

  init() {
    this.origin = createStore(
      this.reducer.bind(this),
      applyMiddleware(loadingInterceptor(this), destroyLoadingInterceptor),
    );

    combine(this.store);
  }

  unmount(): void {
    this.origin = null;
  }

  reducer(
    state: LoadingStoreState | undefined,
    action: AnyAction,
  ): LoadingStoreState {
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
      delete this.status[action.model];
      return next;
    }

    if (isRefreshAction(action)) {
      return {};
    }

    return state;
  }

  get(effect: PromiseEffect | PromiseRoomEffect): LoadingStoreStateItem {
    const {
      _: { model, method },
    } = effect;
    let record: LoadingStoreStateItem | undefined;

    if (this.isActive(model, method)) {
      record = this.getItem(model, method);
    } else {
      this.activate(model, method);
    }

    return record || this.defaultRecord;
  }

  getItem(model: string, method: string): LoadingStoreStateItem | undefined {
    const level1 = this.getState()[model];
    return level1 && level1[method];
  }

  isActive(model: string, method: string): boolean {
    const level1 = this.status[model];
    return level1 !== void 0 && level1[method] === true;
  }

  activate(model: string, method: string) {
    (this.status[model] ||= {})[method] = true;
  }

  inactivate(model: string, method: string) {
    (this.status[model] ||= {})[method] = false;
  }

  refresh() {
    return this.dispatch(actionRefresh(true));
  }
}

export const loadingStore = new LoadingStore();
