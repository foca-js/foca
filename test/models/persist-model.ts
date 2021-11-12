import { cloneModel, defineModel } from '../../src';

const state: {
  counter: number;
} = {
  counter: 0,
};

export const persistModel = defineModel('persist', {
  state,
  actions: {
    plus(state, step: number) {
      state.counter += step;
    },
    minus(state, step: number) {
      state.counter -= step;
    },
  },
});

export const hasVersionPersistModel = cloneModel('persit1', persistModel, {
  state: {
    counter: 56,
  },
  persist: {
    maxAge: 300,
    version: 10,
  },
});

export const hasDecodePersistModel = cloneModel('persist2', persistModel, {
  persist: {
    decode(persist) {
      persist.counter = 57;
    },
  },
});
