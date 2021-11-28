import { freeze } from 'immer';

export const freezeState = <T = any>(state: T): T => {
  return process.env.NODE_ENV === 'production' ? state : freeze(state, true);
};
