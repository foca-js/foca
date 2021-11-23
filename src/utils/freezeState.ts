import { freeze } from 'immer';
import { isCrushed } from './isCrushed';

const DEV = !isCrushed();

export const freezeState = (state: any) => {
  return DEV ? freeze(state, true) : state;
};
