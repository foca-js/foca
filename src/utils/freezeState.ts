import { freeze } from 'immer';
import { isCrushed } from './isCrushed';

const DEV = !isCrushed();

export const freezeState = <T = any>(state: T): T => {
  return DEV ? freeze(state, true) : state;
};
