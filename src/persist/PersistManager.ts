import { Reducer, Store } from 'redux';
import { actionHydrate, isHydrateAction } from '../actions/persist';
import { freezeState } from '../utils/freezeState';
import { PersistItem, PersistOptions } from './PersistItem';

export class PersistManager {
  protected readonly list: PersistItem[] = [];
  protected timer?: NodeJS.Timeout;

  constructor(options: PersistOptions[]) {
    this.list = options.map((option) => new PersistItem(option));
  }

  init(store: Store) {
    store.subscribe(() => {
      this.update(store.getState());
    });

    return Promise.all(
      this.list.map((item) => {
        return item.init();
      }),
    ).then(() => {
      store.dispatch(actionHydrate(this.collect()));
    });
  }

  collect(): Record<string, object> {
    return this.list.reduce<Record<string, object>>((stateMaps, item) => {
      return Object.assign(stateMaps, item.collect());
    }, {});
  }

  combineReducer(original: Reducer): Reducer<Record<string, object>> {
    return (state = {}, action) => {
      if (isHydrateAction(action)) {
        return Object.assign({}, state, freezeState(action.payload));
      }

      return original(state, action);
    };
  }

  protected update(nextState: Record<string, object>) {
    this.timer && clearTimeout(this.timer);
    this.timer = setTimeout(() => {
      this.timer = void this.list.forEach((item) => {
        item.update(nextState);
      });
    }, 50);
  }
}
