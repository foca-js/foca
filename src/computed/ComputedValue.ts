import { ComputedCtx } from '../model/defineModel';
import { ComputedRef, Deps } from './types';
import { depsCollector } from './depsCollector';

export class ComputedValue<T = any> implements ComputedRef<T> {
  public deps: Deps[] = [];

  protected memorized = false;
  protected snapshot: any;
  protected collecting: boolean = false;

  constructor(
    protected readonly ctx: ComputedCtx<any>,
    protected readonly property: string,
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
      });
      this.memorized = true;
      this.end();
    }

    this.collecting = false;

    return this.snapshot;
  }

  isDirty(): boolean {
    for (let i = this.deps.length; i-- > 0; ) {
      if (this.deps[i]!.isDirty()) return true;
    }
    return false;
  }

  protected end(): void {
    if (this.deps.length > 1) {
      const uniqueTagName: string[] = [];
      this.deps = this.deps.filter(({ tagName }) => {
        if (uniqueTagName.indexOf(tagName) === -1) {
          uniqueTagName.push(tagName);
          return true;
        }
        return false;
      });
    }

    for (let i = this.deps.length; i-- > 0; ) {
      this.deps[i]!.end();
    }
  }
}
