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
import { TYPE_PERSIST_HYDRATE, PersistHydrateAction } from '../actions/persist';
import { RefreshAction, TYPE_REFRESH_STORE } from '../actions/refresh';
import { StoreError } from '../exceptions/StoreError';
import { modelInterceptor } from '../middleware/modelInterceptor';
import type { PersistOptions } from '../persist/PersistItem';
import { PersistManager } from '../persist/PersistManager';
import { freezeState } from '../utils/freezeState';

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
  public /*protected*/ persistManager?: PersistManager;

  protected reducer: Reducer;

  /** @deprecated */
  replaceReducer(): never {
    throw new StoreError('store.replaceReducer() had been deprecated.');
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
        throw new StoreError(
          `Call method ${key.toString()} before initialize store.`,
        );
      };
    });
  }

  init(options: CreateStoreOptions = {}) {
    if (this.origin) {
      throw new StoreError('Call store.init() multiple times.');
    }

    if (options.persist) {
      this.reducer = this.combineReducerWithPersist();
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

    assignStoreKeys.forEach((key) => {
      // @ts-expect-error
      this[key] = store[key];
    });

    if (options.persist) {
      const persist = (this.persistManager = new PersistManager(
        options.persist,
      ));

      store.subscribe(() => {
        persist.update(store.getState());
      });

      persist.init().then(() => {
        this.dispatch<PersistHydrateAction>({
          type: TYPE_PERSIST_HYDRATE,
          payload: persist.collect(),
        });
        this.setReady();
      });
    } else {
      this.setReady();
    }

    return this;
  }

  refresh(force: boolean = false): RefreshAction {
    return this.dispatch<RefreshAction>({
      type: TYPE_REFRESH_STORE,
      payload: {
        force,
      },
    });
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
      throw new StoreError(
        'Store is not defined, do you forget to initialize it?',
      );
    }
    return this.origin;
  }

  protected combineReducerWithPersist(): Reducer<Record<string, object>> {
    const reducer = this.reducer;

    return (state = {}, action) => {
      if ((action as PersistHydrateAction).type === TYPE_PERSIST_HYDRATE) {
        const next = Object.assign(
          {},
          state,
          (action as PersistHydrateAction).payload,
        );

        return freezeState(next);
      }

      return reducer(state, action);
    };
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
        hasChanged = hasChanged || nextState[key] !== state[key];
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
