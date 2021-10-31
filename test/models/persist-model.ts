import { cloneModel, defineModel } from '../../src';

interface State {
  counter: number;
}

export const persistModel = defineModel('persist', {
  state: <State>{
    counter: 0,
  },
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
