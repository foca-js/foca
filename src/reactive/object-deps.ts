import type { Store } from 'redux';
import { isObject } from '../utils/is-type';
import { depsCollector } from './deps-collector';

export interface Deps {
  id: string;
  end(): void;
  isDirty(): boolean;
}

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
    if (this.root === rootState) return false;
    const { pathChanged, snapshot: nextSnapshot } = this.getSnapshot(rootState);
    if (pathChanged || this.snapshot !== nextSnapshot) return true;
    this.root = rootState;
    return false;
  }

  get id(): string {
    return this.model + '.' + this.deps.join('.');
  }

  start<T extends Record<string, any>>(startState: T): T {
    depsCollector.append(this);
    return this.proxy(startState);
  }

  end(): void {
    this.active = false;
  }

  protected getState(): T {
    return this.store.getState()[this.model];
  }

  protected getSnapshot(state: any): { pathChanged: boolean; snapshot: any } {
    const deps = this.deps;
    let snapshot = state;
    for (let i = 0; i < deps.length; ++i) {
      if (!isObject<Record<string, any>>(snapshot)) {
        return { pathChanged: true, snapshot };
      }
      snapshot = snapshot[deps[i]!];
    }

    return { pathChanged: false, snapshot };
  }

  protected proxy(currentState: Record<string, any>): any {
    if (
      currentState === null ||
      !isObject<Record<string, any>>(currentState) ||
      Array.isArray(currentState)
    ) {
      return currentState;
    }

    const nextState = {};
    const keys = Object.keys(currentState);
    const currentDeps = this.deps.slice();
    let visited = false;

    for (let i = keys.length; i-- > 0; ) {
      const key = keys[i]!;

      Object.defineProperty(nextState, key, {
        enumerable: true,
        get: () => {
          if (!this.active) return currentState[key];

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
