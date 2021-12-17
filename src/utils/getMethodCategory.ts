export const getMethodCategory = (methodName: string) =>
  methodName.indexOf('_') === 0 ? 'internal' : 'external';
