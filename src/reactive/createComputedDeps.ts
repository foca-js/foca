import { shallowEqual } from 'react-redux';
import type { ComputedValue } from './ComputedValue';
import type { Deps } from './ObjectDeps';

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
