import {
  applyMiddleware,
  compose,
  createStore,
  Middleware,
  PreloadedState,
  Reducer,
  Store,
} from 'redux';
import { $$observable } from '../utils/symbolObservable';
import { KeepToken, Topic } from 'topic';
import { actionRefresh, RefreshAction } from '../actions/refresh';
import { modelInterceptor } from '../middleware/modelInterceptor';
import type { PersistOptions } from '../persist/PersistItem';
import { PersistManager } from '../persist/PersistManager';
import { combine } from './emptyStore';
import { loadingStore } from './loadingStore';

const assignStoreKeys: (keyof Store | symbol)[] = [
  'dispatch',
  'subscribe',
  'getState',
  $$observable,
];

interface CreateStoreOptions {
  preloadedState?: PreloadedState<any>;
  compose?: 'redux-devtools' | typeof compose;
  middleware?: Middleware[];
  persist?: PersistOptions[];
}

class StoreAdvanced implements Store {
  protected topic: Topic<{
    storeReady: [];
  }> = new Topic();
  protected readonly keepToken: KeepToken;
  protected isReady: boolean = false;

  protected origin?: Store;
  protected consumers: Record<string, Reducer> = {};
  protected reducerKeys: string[] = [];
  public /*protected*/ persistor?: PersistManager;

  protected reducer!: Reducer;

  /** @deprecated */
  replaceReducer(): never {
    throw new Error('[store] replaceReducer() had been deprecated.');
  }

  declare dispatch: Store['dispatch'];
  declare subscribe: Store['subscribe'];
  declare getState: Store<Record<string, any>>['getState'];
  declare [Symbol.observable]: Store[typeof Symbol.observable];

  constructor() {
    this.keepToken = this.topic.keep('storeReady', () => this.isReady);

    assignStoreKeys.forEach((key) => {
      // @ts-expect-error
      this[key] = () => {
        throw new Error(`[store] Call method ${key.toString()} before init().`);
      };
    });
  }

  init(options: CreateStoreOptions = {}) {
    const firstInitialize = !this.origin;

    if (!firstInitialize) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('[store] Call init() multiple times.');
      }
    }

    this.isReady = false;
    this.reducer = this.combineReducers();

    if (options.persist && options.persist.length) {
      this.persistor = new PersistManager(options.persist);
      this.reducer = this.persistor.combineReducer(this.reducer);
    } else {
      this.persistor = void 0;
    }

    const store = (this.origin = createStore(
      this.reducer,
      firstInitialize ? options.preloadedState : this.getState(),
      this.getCompose(options.compose)(
        applyMiddleware.apply(
          null,
          (options.middleware || []).concat(modelInterceptor),
        ),
      ),
    ));

    combine(store);

    assignStoreKeys.forEach((key) => {
      // @ts-expect-error
      this[key] = store[key];
    });

    if (this.persistor) {
      this.persistor.init(store, firstInitialize).then(() => {
        this.ready();
      });
    } else {
      this.ready();
    }

    return this;
  }

  refresh(force: boolean = false): RefreshAction {
    return loadingStore.helper.refresh(), this.dispatch(actionRefresh(force));
  }

  onInitialized(): Promise<void> {
    return new Promise((resolve) => {
      if (this.isReady) {
        resolve();
      } else {
        this.topic.subscribeOnce('storeReady', resolve);
      }
    });
  }

  protected ready() {
    this.topic.publish('storeReady');
    this.isReady = true;
  }

  unmount() {
    this.origin = void 0;
    this.isReady = false;
  }

  protected getCompose(
    customCompose: CreateStoreOptions['compose'],
  ): typeof compose {
    return (
      (customCompose === 'redux-devtools'
        ? typeof window === 'object' &&
          // @ts-expect-error
          window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
        : customCompose) || compose
    );
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

  public /*protected*/ appendReducer(key: string, consumer: Reducer) {
    const store = this.origin;
    const exists = store && this.consumers.hasOwnProperty(key);

    this.consumers[key] = consumer;
    this.reducerKeys = Object.keys(this.consumers);
    store && !exists && store.replaceReducer(this.reducer);
  }
}

export const modelStore = new StoreAdvanced();
