const slice = Array.prototype.slice;

export const toArgs = <T = any[]>(args: IArguments, start?: number): T =>
  slice.call(args, start) as unknown as T;
