import type { Meta } from '../reducers/MetaManger';

export class EffectError extends Error {
  constructor(public readonly meta: Meta) {
    super(meta.message);
  }
}
