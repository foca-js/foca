export const cloneDeep = <T>(value: T): T => {
  return JSON.parse(JSON.stringify(value));
};
