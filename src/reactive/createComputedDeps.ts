import type { ComputedValue } from './ComputedValue';
import type { Deps } from './types';

export const createComputedDeps = (body: ComputedValue): Deps => {
  let snapshot: any;

  return {
    id: `c-${body.model}-${body.property}`,
    end(): void {
      snapshot = body.snapshot;
    },
    isDirty(): boolean {
      return snapshot !== body.value;
    },
  };
};
