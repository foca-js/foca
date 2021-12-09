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
    updateUser(staet, id: number, name: string) {
      staet.users[id] = name;
    },
  },
});
