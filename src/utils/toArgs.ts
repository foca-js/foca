const slice = Array.prototype.slice;

export const toArgs = <T = any[]>(args: IArguments): T =>
  slice.call(args) as unknown as T;
