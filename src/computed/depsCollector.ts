import { Deps } from './types';

let deps: Deps[][] = [];
let level = -1;

export const depsCollector = {
  get collecting(): boolean {
    return level >= 0;
  },
  produce(callback: Function): Deps[] {
    const current: Deps[] = (deps[++level] = []);
    callback();
    deps.length = level--;

    if (this.collecting) {
      for (let i = current.length; i-- > 0; ) {
        current[i]!.cloneAndCollect();
      }
    }

    return current;
  },
  write<T extends Deps>(dep: T) {
    deps[level]!.push(dep);
    return dep;
  },
};
