import type { Deps } from './ObjectDeps';

const deps: Deps[][] = [];
let level = -1;

export const depsCollector = {
  get active(): boolean {
    return level >= 0;
  },
  produce(callback: Function): Deps[] {
    const current: Deps[] = (deps[++level] = []);
    callback();
    deps.length = level--;

    const uniqueDeps: Deps[] = [];
    const uniqueID: string[] = [];

    for (let i = 0; i < current.length; ++i) {
      const dep = current[i]!;
      const id = dep.id;
      if (uniqueID.indexOf(id) === -1) {
        uniqueID.push(id);
        uniqueDeps.push(dep);
        dep.end();
      }
    }

    return uniqueDeps;
  },
  append(dep: Deps) {
    deps[level]!.push(dep);
  },
  prepend(dep: Deps) {
    deps[level]!.unshift(dep);
  },
};
