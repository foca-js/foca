import type { Store } from 'redux';
import { depsCollector } from './deps-collector';
import { createComputedDeps } from './create-computed-deps';
import type { Deps } from './object-deps';

export class ComputedValue<T = any> {
  public deps: Deps[] = [];
  public snapshot: any;

  protected active?: boolean;
  protected root?: any;

  constructor(
    protected readonly store: Pick<Store<Record<string, any>>, 'getState'>,
    public readonly model: string,
    public readonly property: string,
    protected readonly fn: () => any,
  ) {}

  public get value(): T {
    if (this.active) {
      throw new Error(
        `[model:${this.model}] 计算属性"${this.property}"正在被循环引用`,
      );
    }

    this.active = true;
    this.isDirty() && this.updateSnapshot();
    this.active = false;

    if (depsCollector.active) {
      // 作为其他computed的依赖
      depsCollector.prepend(createComputedDeps(this));
    }

    return this.snapshot;
  }

  isDirty(): boolean {
    if (!this.root) return true;

    const rootState = this.store.getState();

    if (this.root !== rootState) {
      const deps = this.deps;
      // 前置的元素是createComputedDeps()生成的对象，执行isDirty()会触发ref.value
      // 后置的元素是state，所以需要从后往前判断
      for (let i = deps.length; i-- > 0; ) {
        if (deps[i]!.isDirty()) return true;
      }
    }

    this.root = rootState;
    return false;
  }

  protected updateSnapshot() {
    this.deps = depsCollector.produce(() => {
      this.snapshot = this.fn();
      this.root = this.store.getState();
    });
  }
}
