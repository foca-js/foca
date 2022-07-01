import type { Reducer, Store, Unsubscribe } from 'redux';
import { actionHydrate, isHydrateAction } from '../actions/persist';
import { PersistItem, PersistOptions } from './PersistItem';

export class PersistManager {
  protected initialized: boolean = false;
  protected readonly list: PersistItem[];
  protected timer?: ReturnType<typeof setTimeout>;
  protected unsubscrbeStore!: Unsubscribe;

  constructor(options: PersistOptions[]) {
    this.list = options.map((option) => new PersistItem(option));
  }

  init(store: Store, hydrate: boolean) {
    this.unsubscrbeStore = store.subscribe(() => {
      this.initialized && this.update(store);
    });

    return Promise.all(this.list.map((item) => item.init())).then(() => {
      hydrate && store.dispatch(actionHydrate(this.collect()));
      this.initialized = true;
    });
  }

  destroy() {
    this.unsubscrbeStore();
    this.initialized = false;
  }

  collect(): Record<string, object> {
    return this.list.reduce<Record<string, object>>((stateMaps, item) => {
      return Object.assign(stateMaps, item.collect());
    }, {});
  }

  combineReducer(original: Reducer): Reducer<Record<string, object>> {
    return (state, action) => {
      if (state === void 0) state = {};

      if (isHydrateAction(action)) {
        return Object.assign({}, state, action.payload);
      }

      return original(state, action);
    };
  }

  protected update(store: Store) {
    this.timer ||= setTimeout(() => {
      const nextState = store.getState();
      this.timer = void 0;
      for (let i = this.list.length; i-- > 0; ) {
        this.list[i]!.update(nextState);
      }
    }, 50);
  }
}
