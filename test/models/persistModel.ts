import { cloneModel, defineModel } from '../../src';

const initialState: {
  counter: number;
} = {
  counter: 0,
};

export const persistModel = defineModel('persist', {
  initialState,
  actions: {
    plus(state, step: number) {
      state.counter += step;
    },
    minus(state, step: number) {
      state.counter -= step;
    },
  },
  persist: {
    decode(state) {
      state.counter = state.counter;
    },
  },
});

export const hasVersionPersistModel = cloneModel('persit1', persistModel, {
  initialState: {
    counter: 56,
  },
  persist: {
    maxAge: 300,
    version: 10,
  },
});

export const hasDecodePersistModel = cloneModel('persist2', persistModel, {
  persist: {
    decode(state) {
      state.counter = 57;
    },
  },
});
