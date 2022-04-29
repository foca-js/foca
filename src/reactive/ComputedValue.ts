import type { ComputedRef, Deps } from './types';
import { ComputedCtx } from '../model/defineModel';
import { depsCollector } from './depsCollector';
import { ComputedDeps } from './ComputedDeps';

export class ComputedValue<T = any> implements ComputedRef<T> {
  public deps: Deps[] = [];
  public snapshot: any;

  protected memorized = false;
  protected collecting: boolean = false;

  constructor(
    public readonly ctx: ComputedCtx<any>,
    public readonly property: string,
    protected readonly fn: () => any,
  ) {}

  public get value(): T {
    if (this.collecting) {
      throw new Error(
        `[${this.ctx.name}] computed '${this.property}' circularly references itself`,
      );
    }

    this.collecting = true;

    if (!this.memorized || this.isDirty()) {
      this.deps = depsCollector.produce(() => {
        this.snapshot = this.fn.call(this.ctx);
        this.memorized = true;
      });
    }

    if (depsCollector.collecting) {
      depsCollector.prepend(new ComputedDeps(this));
    }

    this.collecting = false;

    return this.snapshot;
  }

  isDirty(): boolean {
    const deps = this.deps;
    for (let i = deps.length; i-- > 0; ) {
      if (deps[i]!.isDirty()) return true;
    }
    return false;
  }
}
