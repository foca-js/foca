import { cloneModel, defineModel } from '../../src';

const initialState: {
  counter: number;
} = {
  counter: 0,
};

export const persistModel = defineModel('persist', {
  initialState,
  reducers: {
    plus(state, step: number) {
      state.counter += step;
    },
    minus(state, step: number) {
      state.counter -= step;
    },
  },
  persist: {},
});

export const hasVersionPersistModel = cloneModel('persist1', persistModel, {
  initialState: {
    counter: 56,
  },
  persist: {
    version: 10,
  },
});

export const hasFilterPersistModel = cloneModel('persist2', persistModel, {
  persist: {
    dump(state) {
      return state.counter;
    },
    load(counter) {
      return { ...this.initialState, counter: counter + 1 };
    },
  },
});
