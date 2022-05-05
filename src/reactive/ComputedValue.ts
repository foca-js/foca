import type { ComputedRef, Deps } from './types';
import { depsCollector } from './depsCollector';
import { ComputedDeps } from './ComputedDeps';

export class ComputedValue<T = any> implements ComputedRef<T> {
  public deps: Deps[] = [];
  public snapshot: any;

  protected memorized?: boolean;
  protected collecting?: boolean;
  protected root: any;

  constructor(
    protected readonly store: { getState: () => any },
    public readonly modelName: string,
    public readonly property: string,
    protected readonly fn: () => any,
  ) {}

  public get value(): T {
    if (this.collecting) {
      throw new Error(
        `[${this.modelName}] computed '${this.property}' circularly references itself`,
      );
    }

    this.collecting = true;
    const unmemorized = !this.memorized;

    if (unmemorized) {
      this.root = this.store.getState();
      this.memorized = true;
    }

    if (unmemorized || this.isDirty()) {
      this.deps = depsCollector.produce(() => {
        this.snapshot = this.fn();
      });
    }

    if (depsCollector.collecting) {
      depsCollector.prepend(new ComputedDeps(this));
    }

    this.collecting = false;

    return this.snapshot;
  }

  isDirty(): boolean {
    const rootState = this.store.getState();

    if (this.root === rootState) {
      return false;
    }

    const deps = this.deps;
    for (let i = deps.length; i-- > 0; ) {
      if (deps[i]!.isDirty()) return true;
    }

    this.root = rootState;
    return false;
  }
}
