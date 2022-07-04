import sleep from 'sleep-promise';
import { expectType } from 'ts-expect';
import { AnyAction, cloneModel, defineModel } from '../../src';

const initialState: {
  count: number;
  hello: string;
} = {
  count: 0,
  hello: 'world',
};

export const basicModel = defineModel('basic', {
  initialState,
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
    set(state, count: number) {
      state.count = count;
    },
    reset() {
      return this.initialState;
    },
    _actionIsPrivate() {},
    ____alsoPrivateAction() {},
  },
  effects: {
    async foo(hello: string, step: number) {
      await sleep(20);

      this.setState((state) => {
        state.count += step;
        state.hello = hello;
      });

      return 'OK';
    },
    setWithoutFn(step: number) {
      this.setState({
        count: step,
        hello: 'earth',
      });
    },
    setPartialState(step: number) {
      this.setState({
        count: step,
      });
    },
    async bar() {
      return this.foo('', 100);
    },
    async bos() {
      return this.plus(4);
    },
    async hasError(msg: string = 'my-test') {
      throw new Error(msg);
    },
    async pureAsync() {
      await sleep(300);
      return 'OK';
    },
    normalMethod() {
      return 'YES';
    },
    async _effectIsPrivate() {},
    ____alsoPrivateEffect() {
      expectType<() => Promise<void>>(this._effectIsPrivate);
      expectType<() => AnyAction>(this._actionIsPrivate);
      expectType<() => AnyAction>(this.____alsoPrivateAction);
    },
  },
});

export const basicSkipRefreshModel = cloneModel(
  'basicSkipRefresh',
  basicModel,
  {
    skipRefresh: true,
  },
);
