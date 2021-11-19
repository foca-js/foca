const slice = Array.prototype.slice;

export const getArgs = <T = any>(args: IArguments): T[] => slice.call(args);
