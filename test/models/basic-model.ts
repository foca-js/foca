import sleep from 'sleep-promise';
import { defineModel } from '../../src';
import { EffectError } from '../../src/exceptions/EffectError';

const state: {
  count: number;
  hello: string;
} = {
  count: 0,
  hello: 'world',
};

export const basicModel = defineModel('basic', {
  state,
  actions: {
    plus(state, step: number) {
      state.count += step;
    },
    minus(state, step: number) {
      state.count -= step;
    },
    moreParams(state, step: number, hello: string) {
      state.count += step;
      state.hello += ', ' + hello;
    },
    reset() {
      return this.initialState;
    },
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
    dispatchWithoutFunction(step: number) {
      this.dispatch({
        count: step,
        hello: 'earth',
      });
    },
    async bar() {
      return this.foo('', 100);
    },
    async bos() {
      return this.plus(4);
    },
    async hasError() {
      throw new Error('my-test');
    },
    async hasEffectError() {
      throw new EffectError(
        Object.assign(
          { message: 'next-test' },
          {
            hello: 'world',
          },
        ),
      );
    },
    async pureAsync() {
      await sleep(300);
      return 'OK';
    },
    normalMethod() {
      return 'YES';
    },
  },
});
