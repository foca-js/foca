import sleep from 'sleep-promise';
import { defineModel } from '../../src';

const initialState: {
  users: Record<number, string>;
  ids: Array<number>;
} = {
  users: {},
  ids: [],
};

export const complexModel = defineModel('complex', {
  initialState,
  actions: {
    addUser(state, id: number, name: string) {
      state.users[id] = name;
      !state.ids.includes(id) && state.ids.push(id);
    },
    deleteUser(state, id: number) {
      delete state.users[id];
      state.ids = state.ids.filter((item) => item !== id);
    },
    updateUser(state, id: number, name: string) {
      state.users[id] = name;
    },
  },
  effects: {
    *generatorFn(userId: number) {
      yield this._sleep().then().catch();
      yield this.addUser(userId, 'TT');

      return 'generator fn';
    },
    async *asyncGeneratorFn(userId: number) {
      await this._sleep().then().catch();
      yield this.addUser(userId, 'TTC');

      return 'async generator fn';
    },
    *_sleep() {
      this._testAsyncGen().then().catch();
      yield sleep(100);
      return 'ok';
    },
    async *_testAsyncGen() {
      await 'ok';
      return 2;
    },
  },
  hooks: {
    onInit() {
      // 检测内部类型
      this._testAsyncGen()
        .then((value) => value.toFixed())
        .catch();
      this._sleep()
        .then((value) => value.trim())
        .catch();
    },
  },
});
