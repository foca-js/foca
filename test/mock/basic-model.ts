import sleep from 'sleep-promise';
import { defineModel } from '../../src';

interface State {
  count: number;
  hello: string;
}

export const basicModel = defineModel('basic', {
  state: <State>{
    count: 0,
    hello: 'world',
  },
  actions: {
    plus(state, step: number) {
      state.count += step;
    },
    minus(state, step: number) {
      state.count -= step;
    },
    plus_minus(state) {
      state.count += 1;
      queueMicrotask(() => {
        this.dispatch((state) => {
          state.count -= 1;
        });
      });
    },
    moreParams(state, step: number, hello: string) {
      state.count += step;
      state.hello += ', ' + hello;
    },
    // reset() {
    //   return this.initialState;
    // },
  },
  effects: {
    async foo(hello: string, step: number) {
      await sleep(20);

      this.dispatch((state) => {
        state.count += step;
        state.hello = hello;
      });

      return 'OK';
    },
    async bar() {
      return this.foo('', 100);
    },
    async bos() {
      return this.plus_minus();
    },
    async hasError() {
      throw new Error('my-test');
    },
    normalMethod() {
      return 'YES';
    },
  },
});
