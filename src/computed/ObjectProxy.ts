import { isArray } from '../utils/isArray';
import { depsCollector } from './depsCollector';
import { Deps } from './types';

export class ObjectProxy<T = any> implements Deps {
  protected collecting = true;
  protected snapshot: any;
  protected prevRootState: any;

  constructor(
    protected readonly modelName: string,
    protected readonly store: { getState: () => any },
    protected readonly deps: string[] = [],
  ) {
    this.prevRootState = this.getRootState();
    depsCollector.write(this);
  }

  cloneAndCollect(): Deps {
    return new ObjectProxy(this.modelName, this.store, this.deps.slice());
  }

  getRootState(): T {
    return this.store.getState()[this.modelName];
  }

  isDirty(): boolean {
    const state = this.getRootState() as any;

    if (this.prevRootState === state) {
      return false;
    }

    const currentSnapshot = this.getSnapshot(state);

    if (currentSnapshot === this.snapshot) {
      return false;
    }

    this.prevRootState = state;
    this.snapshot = currentSnapshot;
    return true;
  }

  get tagName(): string {
    return this.modelName + '.' + this.deps.join('.');
  }

  start<T>(startState: T): T {
    return this.createProxy(startState);
  }

  end(): void {
    this.collecting = false;
    this.snapshot = this.getSnapshot(this.getRootState());
  }

  protected getSnapshot(state: any) {
    const deps = this.deps;
    let snapshot = state;

    for (let i = 0; i < deps.length; ++i) {
      if (snapshot === null || typeof snapshot !== 'object') {
        break;
      }
      snapshot = snapshot[deps[i]!];
    }

    return snapshot;
  }

  protected createProxy(currentState: Record<string, any>): any {
    if (currentState === null || typeof currentState !== 'object') {
      return currentState;
    }

    const nextState: object | any[] = isArray(currentState) ? [] : {};
    const keys = Object.keys(currentState);
    let visited = false;
    let currentDeps = this.deps.slice();

    for (let i = keys.length; i-- > 0; ) {
      const key = keys[i]!;

      Object.defineProperty(nextState, key, {
        enumerable: true,
        get: () => {
          if (process.env.NODE_ENV !== 'production') {
            if (!this.collecting) {
              throw new Error(
                `[${this.modelName}] Visit value '${this.deps
                  .concat(key)
                  .join('.')}' outside the computed function`,
              );
            }
          }

          if (visited) {
            return new ObjectProxy(
              this.modelName,
              this.store,
              currentDeps.slice(),
            ).start(currentState)[key];
          }

          visited = true;
          this.deps.push(key);
          return this.createProxy(currentState[key]);
        },
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(nextState);
    }

    return nextState;
  }
}
