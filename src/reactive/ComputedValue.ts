import { ComputedCtx } from '../model/defineModel';
import { ComputedRef, Deps } from './types';
import { depsCollector } from './depsCollector';

export class ComputedValue<T = any> implements Deps, ComputedRef<T> {
  public deps: Deps[] = [];
  public readonly tagName: string;

  protected asDeps = false;
  protected memorized = false;
  protected snapshot: any;
  protected collecting: boolean = false;

  constructor(
    protected readonly ctx: ComputedCtx<any>,
    protected readonly property: string,
    protected readonly fn: () => any,
  ) {
    this.tagName = `computed-${ctx.name}-${property}`;
  }

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

    this.collecting = false;
    this.asSuperDeps();

    return this.snapshot;
  }

  isDirty(): boolean {
    return this.asDeps ? this.isSnapshotDirty() : this.isDepsDirty();
  }

  end(): void {
    this.asSuperDeps();
  }

  protected isDepsDirty(): boolean {
    const deps = this.deps;
    for (let i = deps.length; i-- > 0; ) {
      if (deps[i]!.isDirty()) return true;
    }
    return false;
  }

  protected isSnapshotDirty(): boolean {
    const deps = this.deps;

    for (let i = deps.length; i-- > 0; ) {
      if (deps[i]!.isDirty()) {
        return this.snapshot !== this.fn.call(this.ctx);
      }
    }

    return false;
  }

  protected asSuperDeps() {
    if (depsCollector.collecting) {
      const computed = new ComputedValue(this.ctx, this.property, this.fn);

      computed.asDeps = true;
      computed.deps = this.deps;
      computed.memorized = this.memorized;
      computed.snapshot = this.snapshot;
      depsCollector.prepend(computed);
    }
  }
}
