import type { Store } from 'redux';
import type { ComputedRef, Deps } from './types';
import { depsCollector } from './depsCollector';
import { ComputedDeps } from './ComputedDeps';

export class ComputedValue<T = any> implements ComputedRef<T> {
  public deps: Deps[] = [];
  public snapshot: any;

  protected cached?: boolean;
  protected active?: boolean;
  protected root: any;

  constructor(
    protected readonly store: Pick<Store<Record<string, any>>, 'getState'>,
    public readonly model: string,
    public readonly property: string,
    protected readonly fn: () => any,
  ) {}

  public get value(): T {
    if (this.active) {
      throw new Error(
        `[model:${this.model}:computed] 属性'${this.property}'正在处于循环引用状态`,
      );
    }

    this.active = true;
    const uncached = !this.cached;

    if (uncached) {
      this.root = this.store.getState();
      this.cached = true;
    }

    if (uncached || this.isDirty()) {
      this.deps = depsCollector.produce(() => {
        this.snapshot = this.fn();
      });
    }

    if (depsCollector.active) {
      depsCollector.prepend(new ComputedDeps(this));
    }

    this.active = false;

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
