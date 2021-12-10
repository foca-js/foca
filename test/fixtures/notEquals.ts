export const notEquals: Record<string, { a: any; b: any }> = {
  '0 and NaN': {
    a: 0,
    b: NaN,
  },
  '0 and null': {
    a: 0,
    b: null,
  },
  '0 and undefined': {
    a: 0,
    b: undefined,
  },
  '0 and false': {
    a: 0,
    b: false,
  },
  'null and undefined': {
    a: null,
    b: undefined,
  },
  'array and arrayLike': {
    a: [],
    b: { length: 0 },
  },
  'array and arrayLike with length in prototype': {
    a: [],
    b: Object.create({ length: 0 }),
  },
  'array and arrayLike with items': {
    a: [1, 'x'],
    b: { 0: 1, 1: 'x', length: 2 },
  },
  'number': {
    a: 1,
    b: 2,
  },
  'string': {
    a: 'x',
    b: 'y',
  },
  'number and object': {
    a: 1,
    b: {},
  },
  'number and array': {
    a: 3,
    b: [],
  },
  'object and array': {
    a: [],
    b: {},
  },
  'array': {
    a: [1],
    b: [2],
  },
  'complex array': {
    a: [1, { x: { y: 2, z: 3, x: [3] } }, 5],
    b: [1, { x: { y: 2, z: 3, x: [3, 6] } }, 5],
  },
  'array with different length': {
    a: [1],
    b: [1, 2, 3],
  },
  'object': {
    a: { x: 1 },
    b: { x: 2 },
  },
  'complex object': {
    a: {
      x: {
        y: {
          z: [3, 6],
        },
      },
    },
    b: {
      x: {
        y: {
          z: [3, 5],
        },
      },
    },
  },
  'object with different properties': {
    a: { x: 1 },
    b: { x: 1, y: 2 },
  },
  'with different constructor': {
    a: new (class {})(),
    b: new (class {})(),
  },
  'Object.keys() get same length but not own property': {
    a: { x: 3, y: 4 },
    b: (() => {
      const b = Object.create({ x: 3 });
      b.y = 4;
      b.z = 5;
      return b;
    })(),
  },
};
