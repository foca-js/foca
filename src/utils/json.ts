export const jsonStringifyReplacer = (_: string, value: any) => {
  switch (Object.prototype.toString.call(value).slice(8, -1)) {
    case 'Map':
      return `new Map(${JSON.stringify(
        Array.from((value as Map<any, any>).entries()),
      )})`;
    case 'Set':
      return `new Set(${JSON.stringify(
        Array.from((value as Set<any>).values()),
      )})`;
    default:
      return value;
  }
};

const toString = Object.prototype.toString;
const arrayString = '[object Array]';

export const jsonParseReciever = (_: string, value: any) => {
  if (typeof value === 'string') {
    switch (value.slice(0, 8)) {
      case 'new Map(':
        try {
          const maps = JSON.parse(value.slice(8, -1)) as [any, any][];

          if (
            toString.call(maps) === arrayString &&
            maps.every(
              (item) =>
                toString.call(item) === arrayString && item.length === 2,
            )
          ) {
            return new Map(maps);
          }
        } catch {}
        break;
      case 'new Set(':
        try {
          const sets = JSON.parse(value.slice(8, -1)) as any[];

          if (toString.call(sets) === arrayString) {
            return new Set(sets);
          }
        } catch {}
        break;
    }
  }

  return value;
};
