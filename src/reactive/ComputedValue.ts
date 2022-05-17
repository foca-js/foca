import type { Store } from 'redux';
import type { ComputedRef, Deps } from './types';
import { depsCollector } from './depsCollector';
import { ComputedDeps } from './ComputedDeps';

export class ComputedValue<T = any> implements ComputedRef<T> {
  public deps: Deps[] = [];
  public snapshot: any;

  protected active?: boolean;
  protected dirty: boolean = false;
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

    if (this.isDirty()) {
      this.deps = depsCollector.produce(() => {
        this.snapshot = this.fn();
        this.dirty = false;
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
    const prevRoot = this.root;

    if (prevRoot === rootState) {
      return this.dirty;
    }

    this.root = rootState;

    if (!prevRoot) {
      return (this.dirty = true);
    }

    const deps = this.deps;
    for (let i = deps.length; i-- > 0; ) {
      if (deps[i]!.isDirty()) {
        return (this.dirty = true);
      }
    }

    return (this.dirty = false);
  }
}
