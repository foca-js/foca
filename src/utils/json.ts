const toString = Object.prototype.toString;
const objectArray = '[object Array]';
const mapPrefix = 'new Map(';
const setPrefix = 'new Set(';

const getMapSetValue = <T>(value: string): [T, boolean] => {
  const arr = JSON.parse(value.slice(8, -1));
  return [arr, toString.call(arr) === objectArray];
};

export const jsonStringifyReplacer = (_: string, value: any) => {
  switch (toString.call(value).slice(8, -1)) {
    case 'Map':
      return `${mapPrefix}${JSON.stringify(
        Array.from((value as Map<any, any>).entries()),
      )})`;
    case 'Set':
      return `${setPrefix}${JSON.stringify(
        Array.from((value as Set<any>).values()),
      )})`;
    default:
      return value;
  }
};

export const jsonParseReciever = (_: string, value: any) => {
  if (typeof value === 'string') {
    try {
      switch (value.slice(0, 8)) {
        case mapPrefix:
          const [mapArray, isMapArray] = getMapSetValue<[any, any][]>(value);
          if (
            isMapArray &&
            mapArray.every((item) => {
              return toString.call(item) === objectArray && item.length === 2;
            })
          ) {
            return new Map(mapArray);
          }
          break;
        case setPrefix:
          const [setArray, isSetArray] = getMapSetValue<any[]>(value);
          if (isSetArray) {
            return new Set(setArray);
          }
          break;
      }
    } catch {}
  }

  return value;
};
