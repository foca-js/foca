import type { Deps } from './types';

const deps: Deps[][] = [];
let level = -1;

export const depsCollector = {
  get collecting(): boolean {
    return level >= 0;
  },
  produce(callback: Function): Deps[] {
    const current: Deps[] = (deps[++level] = []);
    callback();
    deps.length = level--;

    const filteredDeps = uniqueDeps(current);

    for (let i = filteredDeps.length; i-- > 0; ) {
      filteredDeps[i]!.end();
    }

    return filteredDeps;
  },
  append(dep: Deps) {
    deps[level]!.push(dep);
  },
  prepend(dep: Deps) {
    deps[level]!.unshift(dep);
  },
};

const uniqueDeps = (deps: Deps[]) => {
  if (deps.length <= 1) {
    return deps;
  }

  const uniqueID: string[] = [];
  return deps.filter(({ id }) => {
    if (uniqueID.indexOf(id) === -1) {
      uniqueID.push(id);
      return true;
    }
    return false;
  });
};
