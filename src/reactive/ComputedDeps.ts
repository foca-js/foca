import type { ComputedValue } from './ComputedValue';
import type { Deps } from './types';

export class ComputedDeps implements Deps {
  public readonly id: string;
  protected snapshot: any;

  constructor(protected readonly computedValue: ComputedValue) {
    this.id = `computed-${computedValue.ctx.name}-${computedValue.property}`;
  }

  end(): void {
    this.snapshot = this.computedValue.snapshot;
  }

  isDirty(): boolean {
    return this.snapshot !== this.computedValue.value;
  }
}
