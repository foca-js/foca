import {
  UnknownAction,
  applyMiddleware,
  legacy_createStore as createStore,
  Middleware,
} from 'redux';
import type { PromiseRoomEffect, PromiseEffect } from '../model/enhance-effect';
import { loadingInterceptor } from '../middleware/loading.interceptor';
import { isDestroyLoadingAction, isLoadingAction } from '../actions/loading';
import { actionRefresh, isRefreshAction } from '../actions/refresh';
import { combine } from './proxy-store';
import { destroyLoadingInterceptor } from '../middleware/destroy-loading.interceptor';
import { immer } from '../utils/immer';
import { StoreBasic } from './store-basic';
import { modelStore } from './model-store';
import { freeze } from 'immer';
import { freezeStateMiddleware } from '../middleware/freeze-state.middleware';

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
  protected initializingModels: string[] = [];
  protected status: Partial<{
    [model: string]: Partial<{
      [method: string]: boolean;
    }>;
  }> = {};
  protected defaultRecord: LoadingStoreStateItem = freeze(
    createDefaultRecord(),
    true,
  );

  constructor() {
    super();
    const topic = modelStore.topic;
    topic.subscribe('init', this.init.bind(this));
    topic.subscribe('refresh', this.refresh.bind(this));
    topic.subscribe('unmount', this.unmount.bind(this));
    topic.subscribe('modelPreInit', (modelName) => {
      this.initializingModels.push(modelName);
    });
    topic.subscribe('modelPostInit', (modelName) => {
      this.initializingModels = this.initializingModels.filter(
        (item) => item !== modelName,
      );
    });
  }

  init() {
    const middleware: Middleware[] = [
      loadingInterceptor(this),
      destroyLoadingInterceptor,
    ];

    if (process.env.NODE_ENV !== 'production') {
      middleware.push(freezeStateMiddleware);
    }

    this.origin = createStore(
      this.reducer.bind(this),
      applyMiddleware.apply(null, middleware),
    );

    combine(this.store);
  }

  unmount(): void {
    this.origin = null;
  }

  reducer(
    state: LoadingStoreState | undefined,
    action: UnknownAction,
  ): LoadingStoreState {
    if (state === void 0) {
      state = {};
    }

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

      return next;
    }

    if (isDestroyLoadingAction(action)) {
      const next = Object.assign({}, state);
      delete next[action.model];
      delete this.status[action.model];
      return next;
    }

    if (isRefreshAction(action)) return {};

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

  isModelInitializing(model: string): boolean {
    return (
      this.initializingModels.length > 0 &&
      this.initializingModels.includes(model)
    );
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
