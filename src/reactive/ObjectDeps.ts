import type { Store } from 'redux';
import { isObject } from '../utils/isType';
import { depsCollector } from './depsCollector';
import type { Deps } from './types';

export class ObjectDeps<T = any> implements Deps {
  protected active: boolean = true;
  protected snapshot: any;
  protected root: any;

  constructor(
    protected readonly store: Pick<Store<Record<string, any>>, 'getState'>,
    protected readonly model: string,
    protected readonly deps: string[] = [],
  ) {
    this.root = this.getState();
  }

  isDirty(): boolean {
    const rootState = this.getState();

    if (this.root === rootState) {
      return false;
    }

    if (this.snapshot === this.getSnapshot(rootState)) {
      this.root = rootState;
      return false;
    }

    return true;
  }

  get id(): string {
    return this.model + '.' + this.deps.join('.');
  }

  start<T>(startState: T): T {
    depsCollector.append(this);
    return this.proxy(startState);
  }

  end(): void {
    this.active = false;
  }

  protected getState(): T {
    return this.store.getState()[this.model];
  }

  protected getSnapshot(state: any) {
    const deps = this.deps;
    let snapshot = state;

    for (let i = 0; i < deps.length; ++i) {
      if (!isObject<Record<string, any>>(snapshot)) {
        break;
      }
      snapshot = snapshot[deps[i]!];
    }

    return snapshot;
  }

  protected proxy(currentState: Record<string, any>): any {
    if (currentState === null || !isObject<Record<string, any>>(currentState)) {
      return currentState;
    }

    const nextState: object | any[] = Array.isArray(currentState) ? [] : {};
    const keys = Object.keys(currentState);
    const currentDeps = this.deps.slice();
    let visited = false;

    for (let i = keys.length; i-- > 0; ) {
      const key = keys[i]!;

      Object.defineProperty(nextState, key, {
        enumerable: true,
        get: () => {
          if (!this.active) {
            return currentState[key];
          }

          if (visited) {
            return new ObjectDeps(
              this.store,
              this.model,
              currentDeps.slice(),
            ).start(currentState)[key];
          }

          visited = true;
          this.deps.push(key);
          return this.proxy((this.snapshot = currentState[key]));
        },
      });
    }

    if (process.env.NODE_ENV !== 'production') {
      Object.freeze(nextState);
    }

    return nextState;
  }
}
