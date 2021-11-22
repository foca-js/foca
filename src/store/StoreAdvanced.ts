import { freeze } from 'immer';
import assign from 'object-assign';
import {
  applyMiddleware,
  compose,
  createStore,
  Middleware,
  PreloadedState,
  Reducer,
  Store,
} from 'redux';
import observable from 'symbol-observable';
import { Topic } from 'topic';
import { TYPE_PERSIST_HYDRATE, PersistHydrateAction } from '../actions/persist';
import { RefreshAction, TYPE_REFRESH_STORE } from '../actions/refresh';
import { StoreError } from '../exceptions/StoreError';
import type { PersistOptions } from '../persist/PersistItem';
import { PersistManager } from '../persist/PersistManager';
import type { ReducerManager } from '../reducers/ReducerManager';
import { isCrushed } from '../utils/isCrushed';

const DEV = !isCrushed();

const assignStoreKeys: (keyof Store | symbol)[] = [
  'dispatch',
  'subscribe',
  observable,
];

interface CreateStoreOptions {
  preloadedState?: PreloadedState<any>;
  compose?: 'redux-devtools' | typeof compose;
  middleware?: Middleware[];
  persist?: PersistOptions[];
}

export class StoreAdvanced implements Store {
  protected topic: Topic<{
    storeReady: [];
  }> = new Topic();

  protected origin?: Store;
  protected consumers: Record<string, Reducer> = {};
  protected state: object = {};
  protected dispatching = false;
  protected reducerKeys: string[] = [];
  public /*protected*/ persistManager?: PersistManager;

  protected reducer: Reducer;

  /** @deprecated */
  replaceReducer(): never {
    throw new StoreError('store.replaceReducer() had been deprecated.');
  }

  declare dispatch: Store['dispatch'];
  declare subscribe: Store['subscribe'];
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

  getState(): ReturnType<Store<Record<string, any>>['getState']> {
    return this.dispatching ? this.state : this.store.getState();
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
        applyMiddleware.apply(null, options.middleware || []),
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
        this.topic.keep('storeReady', true);
      });
    } else {
      this.topic.keep('storeReady', true);
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

  onReady(callback: Function) {
    return this.topic.subscribeOnce('storeReady', () => {
      callback();
    });
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

  protected get store() {
    if (!this.origin) {
      throw new StoreError(
        'Store is not defined, do you forget to initialize it?',
      );
    }
    return this.origin;
  }

  protected combineReducerWithPersist(): Reducer<Record<string, object>> {
    const reducer = this.reducer;

    return (state, action) => {
      if (state === void 0) {
        state = {};
      }

      if ((action as PersistHydrateAction).type === TYPE_PERSIST_HYDRATE) {
        const next = assign(
          {},
          state,
          (action as PersistHydrateAction).payload,
        );

        return DEV ? freeze(next, true) : next;
      }

      return reducer(state, action);
    };
  }

  protected combineReducers(): Reducer<Record<string, object>> {
    return (state, action) => {
      if (state === void 0) {
        state = {};
      }

      this.dispatching = true;
      this.state = state;

      const reducerKeys = this.reducerKeys;
      const keyAmount = reducerKeys.length;
      const nextState: Record<string, any> = {};
      let hasChanged = false;

      for (let i = 0; i < keyAmount; ++i) {
        const key = reducerKeys[i]!;
        const consumer = this.consumers[key]!;
        const prevStateForKey = state[key];
        const nextStateForKey = consumer(prevStateForKey, action);

        nextState[key] = nextStateForKey;
        hasChanged = hasChanged || nextStateForKey !== prevStateForKey;
      }

      hasChanged = hasChanged || keyAmount !== Object.keys(state).length;

      this.dispatching = false;
      this.state = {};

      return hasChanged ? nextState : state;
    };
  }

  public /*protected*/ unmount(): this {
    this.origin = undefined;
    this.state = {};
    this.persistManager = undefined;
    this.topic = new Topic();
    return this;
  }

  public /*protected*/ appendReducer(reducer: ReducerManager<object>) {
    const key = reducer.name;
    const store = this.origin;
    const exists = store && this.consumers.hasOwnProperty(key);

    this.consumers[key] = reducer.consumer.bind(reducer);
    this.reducerKeys = Object.keys(this.consumers);
    store && !exists && store.replaceReducer(this.reducer);
  }
}
