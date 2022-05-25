import {
  AnyAction,
  applyMiddleware,
  compose,
  legacy_createStore as createStore,
  Middleware,
  PreloadedState,
  Reducer,
  Store,
  StoreEnhancer,
} from 'redux';
import { $$observable } from '../utils/symbolObservable';
import { KeepToken, Topic } from 'topic';
import { actionRefresh, RefreshAction } from '../actions/refresh';
import { modelInterceptor } from '../middleware/modelInterceptor';
import type { PersistOptions } from '../persist/PersistItem';
import { PersistManager } from '../persist/PersistManager';
import { combine } from './proxyStore';
import { loadingStore } from './loadingStore';
import { OBJECT } from '../utils/isType';

type Compose = typeof compose | ((enhancer: StoreEnhancer) => StoreEnhancer);

interface CreateStoreOptions {
  preloadedState?: PreloadedState<any>;
  compose?: 'redux-devtools' | Compose;
  middleware?: Middleware[];
  persist?: PersistOptions[];
}

const topicName = 'storeReady';

class StoreAdvanced implements Store {
  protected topic: Topic<{
    [K in typeof topicName]: [];
  }> = new Topic();
  protected readonly keepToken: KeepToken;
  protected _isReady: boolean = false;

  protected origin?: Store;
  protected consumers: Record<string, Reducer> = {};
  protected reducerKeys: string[] = [];
  /**
   * @protected
   */
  public persistor: PersistManager | null = null;

  protected reducer!: Reducer;

  constructor() {
    this.keepToken = this.topic.keep(topicName, () => this._isReady);
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
    let persistor = this.persistor;
    persistor && persistor.destroy();
    if (persistOptions && persistOptions.length) {
      persistor = this.persistor = new PersistManager(persistOptions);
      this.reducer = persistor.combineReducer(this.reducer);
    } else {
      persistor = this.persistor = null;
    }

    let store: Store;

    if (firstInitialize) {
      const enhancer: StoreEnhancer<any> = applyMiddleware.apply(
        null,
        (options.middleware || []).concat(modelInterceptor),
      );

      store = this.origin = createStore(
        this.reducer,
        options.preloadedState,
        this.getCompose(options.compose)(enhancer),
      );

      combine(store);
    } else {
      // 重新创建store会导致组件里的subscription都失效
      store = prevStore;
      store.replaceReducer(this.reducer);
    }

    if (persistor) {
      persistor.init(store, firstInitialize).then(() => {
        this.ready();
      });
    } else {
      this.ready();
    }

    return this;
  }

  /**
   * @deprecated 请勿使用该方法，因为它其实没有被实现
   */
  declare replaceReducer: Store['replaceReducer'];

  dispatch: Store['dispatch'] = (action) => {
    return this.store.dispatch(action);
  };

  getState: Store<Record<string, any>>['getState'] = () => {
    return this.store.getState();
  };

  subscribe: Store['subscribe'] = (listener) => {
    return this.store.subscribe(listener);
  };

  [$$observable]: Store[typeof $$observable] = () => {
    return this.store[$$observable]();
  };

  refresh(force: boolean = false): RefreshAction {
    return loadingStore.helper.refresh(), this.dispatch(actionRefresh(force));
  }

  unmount() {
    this.origin = void 0;
    this._isReady = false;
  }

  onInitialized(): Promise<void> {
    return new Promise((resolve) => {
      if (this._isReady) {
        resolve();
      } else {
        this.topic.subscribeOnce(topicName, resolve);
      }
    });
  }

  protected ready() {
    this._isReady = true;
    this.topic.publish(topicName);
  }

  protected get store(): Store<Record<string, object>, AnyAction> {
    if (!this.origin) {
      throw new Error(`[store] 当前无实例，忘记执行'store.init()'了吗？`);
    }
    return this.origin;
  }

  protected getCompose(customCompose: CreateStoreOptions['compose']): Compose {
    if (customCompose === 'redux-devtools') {
      if (process.env.NODE_ENV !== 'production') {
        return (
          /** @ts-expect-error */
          (typeof window === OBJECT
            ? window
            : /* istanbul ignore next */
            typeof global === OBJECT
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
      if (state === void 0) state = {};

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

  /**
   * @protected
   */
  public appendReducer(key: string, consumer: Reducer): void {
    const store = this.origin;
    const consumers = this.consumers;
    const exists = store && consumers.hasOwnProperty(key);

    consumers[key] = consumer;
    this.reducerKeys = Object.keys(consumers);
    store && !exists && store.replaceReducer(this.reducer);
  }

  /**
   * @protected
   */
  public removeReducer(key: string): void {
    const store = this.origin;
    const consumers = this.consumers;

    if (consumers.hasOwnProperty(key)) {
      delete consumers[key];
      this.reducerKeys = Object.keys(consumers);
      store && store.replaceReducer(this.reducer);
    }
  }
}

export const modelStore = new StoreAdvanced();
