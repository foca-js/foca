import { Meta } from '../actions/meta';

export class EffectError extends Error {
  constructor(public readonly meta: Meta) {
    super(meta.message);
  }
}
