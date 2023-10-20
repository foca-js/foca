import { Store } from 'redux';
import { $$observable } from '../utils/symbol-observable';

export abstract class StoreBasic<T> implements Store<T> {
  protected origin: Store<T> | null = null;

  /**
   * @deprecated 请勿使用该方法，因为它其实没有被实现
   */
  declare replaceReducer: Store<T>['replaceReducer'];

  dispatch: Store<T>['dispatch'] = (action) => {
    return this.store.dispatch(action);
  };

  getState: Store<T>['getState'] = () => {
    return this.store.getState();
  };

  subscribe: Store<T>['subscribe'] = (listener) => {
    return this.store.subscribe(listener);
  };

  [$$observable]: Store<T>[typeof $$observable] = () => {
    return this.store[$$observable]();
  };

  protected get store(): Store<T> {
    if (!this.origin) {
      throw new Error(`[store] 当前无实例，忘记执行'store.init()'了吗？`);
    }
    return this.origin;
  }

  abstract init(): void;
  abstract unmount(): void;
}
