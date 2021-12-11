import {
  AnyAction,
  applyMiddleware,
  compose,
  createStore,
  Middleware,
  PreloadedState,
  Reducer,
  Store,
} from 'redux';
import { $$observable } from '../utils/symbolObservable';
import { SubscribeToken, Topic } from 'topic';
import { actionRefresh, RefreshAction } from '../actions/refresh';
import { modelInterceptor } from '../middleware/modelInterceptor';
import type { PersistOptions } from '../persist/PersistItem';
import { PersistManager } from '../persist/PersistManager';
import { combine } from './emptyStore';

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
  public /*protected*/ topic: Topic<{
    storeReady: [];
  }> = new Topic();
  public /*protected*/ origin?: Store;
  protected consumers: Record<string, Reducer> = {};
  protected reducerKeys: string[] = [];
  public /*protected*/ persistor?: PersistManager;

  protected reducer: Reducer;

  /** @deprecated */
  replaceReducer(): never {
    throw new Error('[store] replaceReducer() had been deprecated.');
  }

  declare dispatch: Store['dispatch'];
  declare subscribe: Store['subscribe'];
  declare getState: Store<Record<string, any>>['getState'];
  declare [Symbol.observable]: Store[typeof Symbol.observable];

  constructor() {
    this.reducer = this.combineReducers();

    assignStoreKeys.forEach((key) => {
      // @ts-expect-error
      this[key] = () => {
        throw new Error(`[store] Call method ${key.toString()} before init().`);
      };
    });
  }

  init(options: CreateStoreOptions = {}) {
    if (this.origin) {
      throw new Error('[store] Call init() multiple times.');
    }

    if (options.persist && options.persist.length) {
      this.persistor = new PersistManager(options.persist);
      this.reducer = this.persistor.combineReducer(this.reducer);
    }

    const store = (this.origin = createStore(
      this.reducer,
      options.preloadedState,
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
      this.persistor.init(store).then(() => {
        this.setReady();
      });
    } else {
      this.setReady();
    }

    return this;
  }

  refresh(force: boolean = false): RefreshAction {
    return this.dispatch(actionRefresh(force));
  }

  onReady(callback: Function): SubscribeToken {
    return this.topic.subscribeOnce('storeReady', () => {
      callback();
    });
  }

  protected setReady() {
    this.topic.keep('storeReady', true);
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

  protected get store(): Store<Record<string, object>, AnyAction> {
    if (!this.origin) {
      throw new Error('Store is not defined, do you forget to initialize it?');
    }
    return this.origin;
  }

  protected combineReducers(): Reducer<Record<string, object>> {
    return (state = {}, action) => {
      const reducerKeys = this.reducerKeys;
      const keyLength = reducerKeys.length;
      const nextState: Record<string, any> = {};
      let hasChanged = false;

      for (let i = 0; i < keyLength; ++i) {
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
