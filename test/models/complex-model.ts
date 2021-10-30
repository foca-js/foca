import { defineModel } from '../../src';

interface State {
  users: Map<number, string>;
  ids: Set<number>;
}

export const complexModel = defineModel('complex', {
  state: <State>{
    users: new Map(),
    ids: new Set(),
  },
  actions: {
    addUser(state, id: number, name: string) {
      state.users.set(id, name);
      state.ids.add(id);
    },
    deleteUser(state, id: number) {
      state.users.delete(id);
      state.ids.delete(id);
    },
    updateUser(staet, id: number, name: string) {
      staet.users.set(id, name);
    },
  },
});
