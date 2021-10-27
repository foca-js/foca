import { applyMiddleware, compose, createStore, Middleware, Reducer, Store } from 'redux';
import observable from 'symbol-observable';
import { RefreshAction, ACTION_TYPE_REFRESH } from '../actions/refresh';
import { StoreError } from '../exceptions/StoreError';
import type { Model } from '../model/defineModel';
import { PersistEngine } from '../storages/PersistEngine';
import type { ReducerManager } from '../reducers/ReducerManager';

const assignStoreKeys: (keyof Store | symbol)[] = ['dispatch', 'subscribe', observable];

interface CreateStoreOptions {
  compose?: 'default' | 'redux-devtools' | typeof compose;
  middleware?: Middleware[];
  persist?: Array<{
    /**
     * 存储标识名称
     */
    key: string;
    /**
     * 版本号
     */
    version: string | number;
    /**
     * 存储引擎
     */
    engine: PersistEngine;
    /**
     * 允许同步的模型列表
     */
    models: Model<any, any, any, any>[];
  }>;
}

export class StoreAdvanced implements Store {
  protected origin?: Store;
  protected consumers: Record<string, Reducer> = {};
  protected state: object = {};
  protected dispatching = false;
  protected reducerKeys: string[] = [];

  protected readonly reducer: Reducer;

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
      //@ts-ignore
      this[key] = () => {
        throw new StoreError(`Call method ${key.toString()} before initialize store.`);
      };
    });
  }

  getState(): ReturnType<Store<Record<string, any>>['getState']> {
    return this.dispatching ? this.state : this.store.getState();
  }

  init(options: CreateStoreOptions): void {
    if (this.origin) {
      if (process.env.NODE_ENV === 'production') {
        throw new Error('Call store.init() multiple times.');
      }
      return;
    }

    const customCompose = this.getCompose(options.compose);

    const store = (this.origin = createStore(
      this.reducer,
      customCompose(applyMiddleware.apply(null, options.middleware || [])),
    ));
    assignStoreKeys.forEach((key) => {
      // @ts-ignore
      this[key] = store[key];
    });
  }

  refresh(force: boolean = false): RefreshAction {
    return this.dispatch<RefreshAction>({
      type: ACTION_TYPE_REFRESH,
      payload: {
        force,
      },
    });
  }

  protected getCompose(customCompose: CreateStoreOptions['compose']): typeof compose {
    switch (customCompose) {
      case 'redux-devtools':
        return (
          (typeof window === 'object' &&
            // @ts-expect-error
            window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__) ||
          compose
        );
      case 'default':
        return compose;
      default:
        return customCompose || compose;
    }
  }

  protected get store() {
    if (!this.origin) {
      throw new StoreError('Store is not defined, do you forget to initialize it?');
    }
    return this.origin;
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

      // if (hasChanged) {
      //   this.persist.update(nextState, action.type === ACTION_TYPES.persist);
      // }

      this.dispatching = false;
      this.state = {};

      return hasChanged ? nextState : state;
    };
  }

  protected appendReducer(reducer: ReducerManager<object>) {
    const key = reducer.name;
    const store = this.origin;
    const exists = store && this.consumers.hasOwnProperty(key);

    this.consumers[key] = reducer.consumer.bind(reducer);
    this.reducerKeys = Object.keys(this.consumers);
    store && !exists && store.replaceReducer(this.reducer);
  }

  static appendReducer(reducer: ReducerManager<object>) {
    store.appendReducer(reducer);
  }
}

export const store = new StoreAdvanced();
