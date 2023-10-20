import { shallowEqual } from 'react-redux';
import type { ComputedValue } from './computed-value';
import type { Deps } from './object-deps';

export const createComputedDeps = (body: ComputedValue): Deps => {
  let snapshot: any;

  return {
    id: `c-${body.model}-${body.property}`,
    end(): void {
      snapshot = body.snapshot;
    },
    isDirty(): boolean {
      return !shallowEqual(snapshot, body.value);
    },
  };
};
