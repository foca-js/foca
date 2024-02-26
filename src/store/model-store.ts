import {
  applyMiddleware,
  compose,
  legacy_createStore as createStore,
  Middleware,
  Reducer,
  Store,
  StoreEnhancer,
} from 'redux';
import { Topic } from 'topic';
import { actionRefresh, RefreshAction } from '../actions/refresh';
import { modelInterceptor } from '../middleware/model.interceptor';
import type { PersistOptions } from '../persist/persist-item';
import { PersistManager } from '../persist/persist-manager';
import { combine } from './proxy-store';
import { OBJECT } from '../utils/is-type';
import { StoreBasic } from './store-basic';
import { actionInActionInterceptor } from '../middleware/action-in-action.interceptor';
import { freezeStateMiddleware } from '../middleware/freeze-state.middleware';

type Compose =
  | typeof compose
  | ((...funcs: StoreEnhancer<any>[]) => StoreEnhancer<any>);

interface CreateStoreOptions {
  preloadedState?: Record<string, any>;
  compose?: 'redux-devtools' | Compose;
  middleware?: Middleware[];
  persist?: PersistOptions[];
}

export class ModelStore extends StoreBasic<Record<string, any>> {
  public topic: Topic<{
    init: [];
    ready: [];
    refresh: [];
    unmount: [];
    modelPreInit: [modelName: string];
    modelPostInit: [modelName: string];
  }> = new Topic();
  protected _isReady: boolean = false;
  protected consumers: Record<string, Reducer> = {};
  protected reducerKeys: string[] = [];
  protected persister: PersistManager | null = null;

  protected reducer!: Reducer;

  constructor() {
    super();
    this.topic.keep('ready', () => this._isReady);
  }

  get isReady(): boolean {
    return this._isReady;
  }

  init(options: CreateStoreOptions = {}) {
    const prevStore = this.origin;
    const firstInitialize = !prevStore;

    if (!firstInitialize) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`[store] 请勿多次执行'store.init()'`);
      }
    }

    this._isReady = false;
    this.reducer = this.combineReducers();

    const persistOptions = options.persist;
    let persister = this.persister;
    persister && persister.destroy();
    if (persistOptions && persistOptions.length) {
      persister = this.persister = new PersistManager(persistOptions);
      this.reducer = persister.combineReducer(this.reducer);
    } else {
      persister = this.persister = null;
    }

    let store: Store;

    if (firstInitialize) {
      const middleware = (options.middleware || []).concat(modelInterceptor);
      /* istanbul ignore else -- @preserve */
      if (process.env.NODE_ENV !== 'production') {
        middleware.unshift(actionInActionInterceptor);
        middleware.push(freezeStateMiddleware);
      }

      const enhancer = applyMiddleware.apply(null, middleware);

      store = this.origin = createStore(
        this.reducer,
        options.preloadedState,
        this.getCompose(options.compose)(enhancer),
      );
      this.topic.publish('init');

      combine(store);
    } else {
      // 重新创建store会导致组件里的subscription都失效
      store = prevStore;
      store.replaceReducer(this.reducer);
    }

    if (persister) {
      persister.init(store, firstInitialize).then(() => {
        this.ready();
      });
    } else {
      this.ready();
    }

    return this;
  }

  refresh(force: boolean = false): RefreshAction {
    const action = this.dispatch(actionRefresh(force));
    this.topic.publish('refresh');
    return action;
  }

  unmount() {
    this.origin = null;
    this._isReady = false;
    this.topic.publish('unmount');
  }

  onInitialized(maybeSync?: () => void): Promise<void> {
    return new Promise((resolve) => {
      if (this._isReady) {
        maybeSync && maybeSync();
        resolve();
      } else {
        this.topic.subscribeOnce('ready', () => {
          maybeSync && maybeSync();
          resolve();
        });
      }
    });
  }

  protected ready() {
    this._isReady = true;
    this.topic.publish('ready');
  }

  protected getCompose(customCompose: CreateStoreOptions['compose']): Compose {
    if (customCompose === 'redux-devtools') {
      /* istanbul ignore if -- @preserve */
      if (process.env.NODE_ENV !== 'production') {
        return (
          /** @ts-expect-error */
          (typeof window === OBJECT
            ? window
            : typeof global === OBJECT
              ? global
              : {})['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] || compose
        );
      }

      return compose;
    }

    return customCompose || compose;
  }

  protected combineReducers(): Reducer<Record<string, object>> {
    return (state, action) => {
      if (state === void 0) {
        state = {};
      }

      const reducerKeys = this.reducerKeys;
      const consumers = this.consumers;
      const keyLength = reducerKeys.length;
      const nextState: Record<string, any> = {};
      let hasChanged = false;
      let i = keyLength;

      while (i-- > 0) {
        const key = reducerKeys[i]!;
        const prevForKey = state[key];
        const nextForKey = (nextState[key] = consumers[key]!(
          prevForKey,
          action,
        ));
        hasChanged ||= nextForKey !== prevForKey;
      }

      return hasChanged || keyLength !== Object.keys(state).length
        ? nextState
        : state;
    };
  }

  protected appendReducer(key: string, consumer: Reducer): void {
    const store = this.origin;
    const consumers = this.consumers;
    const exists = store && consumers.hasOwnProperty(key);

    consumers[key] = consumer;
    this.reducerKeys = Object.keys(consumers);
    store && !exists && store.replaceReducer(this.reducer);
  }

  protected removeReducer(key: string): void {
    const store = this.origin;
    const consumers = this.consumers;

    if (consumers.hasOwnProperty(key)) {
      delete consumers[key];
      this.reducerKeys = Object.keys(consumers);
      store && store.replaceReducer(this.reducer);
    }
  }
}

export const modelStore = new ModelStore();
