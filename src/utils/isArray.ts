const opt = Object.prototype.toString;

export const isArray = (value: object) =>
opt.call(value) === '[object Array]';
