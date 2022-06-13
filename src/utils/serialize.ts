import { isObject } from './isType';

const JSON_UNDEFINED = '__JSON_UNDEFINED__';

const replacer = (_key: string, value: any) => {
  return value === void 0 ? JSON_UNDEFINED : value;
};

const reviver = (_key: string, value: any) => {
  if (isObject<Record<string, any>>(value)) {
    const keys = Object.keys(value);
    for (let i = keys.length; i-- > 0; ) {
      const key = keys[i]!;
      if (value[key] === JSON_UNDEFINED) {
        value[key] = void 0;
      }
    }
  }

  return value;
};

export const stringifyState = (value: any) => {
  return JSON.stringify(value, replacer);
};

export const parseState = (value: string) => {
  return JSON.parse(
    value,
    value.indexOf(JSON_UNDEFINED) >= 0 ? reviver : void 0,
  );
};
