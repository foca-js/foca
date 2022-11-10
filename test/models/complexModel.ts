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
  reducers: {
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
});
