import { TypeEqual, expectType } from 'ts-expect';
import { cloneModel, defineModel } from '../../src';
import { GetInitialState } from '../../src/model/types';

const state: { hello: string } = { hello: 'world' };

defineModel('model', {
  initialState: state,
  // @ts-expect-error
  persist: {
    dump() {
      return '';
    },
  },
});

defineModel('model', {
  initialState: state,
  // @ts-expect-error
  persist: {
    load() {
      return {} as typeof state;
    },
  },
});

defineModel('model', {
  initialState: state,
  persist: {
    dump() {
      return '';
    },
    load() {
      return {} as typeof state;
    },
  },
});

defineModel('model', {
  initialState: state,
  persist: {},
});

defineModel('model', {
  initialState: state,
  persist: {
    version: 1,
  },
});

defineModel('model', {
  initialState: state,
  persist: {
    version: '1.0.0',
  },
});

const model = defineModel('model', {
  initialState: state,
  persist: {
    dump(state) {
      return state.hello;
    },
    load(s) {
      expectType<TypeEqual<string, typeof s>>(true);
      expectType<TypeEqual<GetInitialState<typeof state>, typeof this>>(true);
      return { hello: s };
    },
  },
});

cloneModel('model-1', model, {
  persist: {},
});

cloneModel('model-1', model, {
  persist: {
    version: '',
  },
});

cloneModel('model-1', model, {
  persist: {
    dump(state) {
      return state.hello;
    },
    load(s) {
      expectType<TypeEqual<string, typeof s>>(true);
      expectType<TypeEqual<GetInitialState<typeof state>, typeof this>>(true);
      return { hello: s };
    },
  },
});

cloneModel('model-1', model, {
  persist: {
    dump() {
      return 0;
    },
    load(s) {
      expectType<TypeEqual<number, typeof s>>(true);
      return { hello: String(s) };
    },
  },
});

cloneModel('model-1', model, {
  // @ts-expect-error
  persist: {
    dump() {
      return 0;
    },
  },
});

cloneModel('model-1', model, {
  // @ts-expect-error
  persist: {
    load(dumpData) {
      return dumpData as typeof state;
    },
  },
});
