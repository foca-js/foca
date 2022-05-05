import { isArray } from '../utils/isArray';
import { depsCollector } from './depsCollector';
import type { Deps } from './types';

export class ObjectDeps<T = any> implements Deps {
  protected collecting: boolean = true;
  protected snapshot: any;
  protected memoRootState: any;

  constructor(
    protected readonly store: { getState: () => any },
    protected readonly modelName: string,
    protected readonly deps: string[] = [],
  ) {
    this.memoRootState = this.getRootState();
  }

  isDirty(): boolean {
    const rootState = this.getRootState() as any;

    if (this.memoRootState === rootState) {
      return false;
    }

    if (this.snapshot === this.getSnapshot(rootState)) {
      this.memoRootState = rootState;
      return false;
    }

    return true;
  }

  get id(): string {
    return this.modelName + '.' + this.deps.join('.');
  }

  start<T>(startState: T): T {
    depsCollector.append(this);
    return this.createProxy(startState);
  }

  end(): void {
    this.collecting = false;
  }

  protected getRootState(): T {
    return this.store.getState()[this.modelName];
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
    const currentDeps = this.deps.slice();
    let visited = false;

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
            return new ObjectDeps(
              this.store,
              this.modelName,
              currentDeps.slice(),
            ).start(currentState)[key];
          }

          visited = true;
          this.deps.push(key);
          return this.createProxy((this.snapshot = currentState[key]));
        },
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(nextState);
    }

    return nextState;
  }
}
