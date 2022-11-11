import {
  applyMiddleware,
  compose,
  legacy_createStore as createStore,
  Middleware,
  PreloadedState,
  Reducer,
  Store,
  StoreEnhancer,
} from 'redux';
import { Topic } from 'topic';
import { actionRefresh, RefreshAction } from '../actions/refresh';
import { modelInterceptor } from '../middleware/modelInterceptor';
import type { PersistOptions } from '../persist/PersistItem';
import { PersistManager } from '../persist/PersistManager';
import { combine } from './proxyStore';
import { OBJECT } from '../utils/isType';
import { StoreBasic } from './StoreBasic';
import { actionInActionInterceptor } from '../middleware/actionInActionInterceptor';
import { freezeStateMiddleware } from '../middleware/freezeStateMiddleware';

type Compose = typeof compose | ((enhancer: StoreEnhancer) => StoreEnhancer);

interface CreateStoreOptions {
  preloadedState?: PreloadedState<any>;
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
  }> = new Topic();
  protected _isReady: boolean = false;
  protected consumers: Record<string, Reducer> = {};
  protected reducerKeys: string[] = [];
  /**
   * @protected
   */
  public persistor: PersistManager | null = null;

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
      const middleware = (options.middleware || []).concat(modelInterceptor);
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

    if (persistor) {
      persistor.init(store, firstInitialize).then(() => {
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

  onInitialized(): Promise<void> {
    return new Promise((resolve) => {
      if (this._isReady) {
        resolve();
      } else {
        this.topic.subscribeOnce('ready', resolve);
      }
    });
  }

  protected ready() {
    this._isReady = true;
    this.topic.publish('ready');
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

  public static appendReducer(
    this: ModelStore,
    key: string,
    consumer: Reducer,
  ): void {
    const store = this.origin;
    const consumers = this.consumers;
    const exists = store && consumers.hasOwnProperty(key);

    consumers[key] = consumer;
    this.reducerKeys = Object.keys(consumers);
    store && !exists && store.replaceReducer(this.reducer);
  }

  public static removeReducer(this: ModelStore, key: string): void {
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
