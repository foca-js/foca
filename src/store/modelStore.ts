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

type Compose = typeof compose | ((enhancer: StoreEnhancer) => StoreEnhancer);

interface CreateStoreOptions {
  preloadedState?: PreloadedState<any>;
  compose?: 'redux-devtools' | Compose;
  middleware?: Middleware[];
  persist?: PersistOptions[];
}

class StoreAdvanced implements Store {
  protected topic: Topic<{
    storeReady: [];
  }> = new Topic();
  protected readonly keepToken: KeepToken;
  protected _isReady: boolean = false;

  protected origin?: Store;
  protected consumers: Record<string, Reducer> = {};
  protected reducerKeys: string[] = [];
  /**
   * @protected
   */
  public persistor?: PersistManager;

  protected reducer!: Reducer;

  constructor() {
    this.keepToken = this.topic.keep('storeReady', () => this._isReady);
  }

  get isReady(): boolean {
    return this._isReady;
  }

  init(options: CreateStoreOptions = {}) {
    const firstInitialize = !this.origin;

    if (!firstInitialize) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error(`[store] 请勿多次执行'store.init()'`);
      }
    }

    this._isReady = false;
    this.reducer = this.combineReducers();
    this.persistor && this.persistor.destroy();

    if (options.persist && options.persist.length) {
      this.persistor = new PersistManager(options.persist);
      this.reducer = this.persistor.combineReducer(this.reducer);
    } else {
      this.persistor = void 0;
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
      store = this.origin!;
      store.replaceReducer(this.reducer);
    }

    if (this.persistor) {
      this.persistor.init(store, firstInitialize).then(() => {
        this.ready();
      });
    } else {
      this.ready();
    }

    return this;
  }

  /** @deprecated */
  replaceReducer(): never {
    throw new Error(`[store] 请勿使用'replaceReducer'方法`);
  }

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
        this.topic.subscribeOnce('storeReady', resolve);
      }
    });
  }

  protected ready() {
    this._isReady = true;
    this.topic.publish('storeReady');
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
          (typeof window === 'object'
            ? window
            : typeof global === 'object'
            ? global
            : {})['__REDUX_DEVTOOLS_EXTENSION_COMPOSE__'] || compose
        );
      }

      return compose;
    }

    return customCompose || compose;
  }

  protected combineReducers(): Reducer<Record<string, object>> {
    return (state = {}, action) => {
      const reducerKeys = this.reducerKeys;
      const keyLength = reducerKeys.length;
      const nextState: Record<string, any> = {};
      let hasChanged = false;
      let i = keyLength;

      while (i-- > 0) {
        const key = reducerKeys[i]!;
        nextState[key] = this.consumers[key]!(state[key], action);
        hasChanged ||= nextState[key] !== state[key];
      }

      return hasChanged || keyLength !== Object.keys(state).length
        ? nextState
        : state;
    };
  }

  /**
   * @protected
   */
  public appendReducer(key: string, consumer: Reducer) {
    const store = this.origin;
    const exists = store && this.consumers.hasOwnProperty(key);

    this.consumers[key] = consumer;
    this.reducerKeys = Object.keys(this.consumers);
    store && !exists && store.replaceReducer(this.reducer);
  }
}

export const modelStore = new StoreAdvanced();
