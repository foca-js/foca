export const equals: Record<string, { a: any; b: any }> = {
  '0 and -0': {
    a: 0,
    b: -0,
  },
  'NaN': {
    a: NaN,
    b: NaN,
  },
  'number': {
    a: 1,
    b: 1,
  },
  'string': {
    a: 'x',
    b: 'x',
  },
  'empty array': {
    a: [],
    b: [],
  },
  'array': {
    a: [1, 2, 'x'],
    b: [1, 2, 'x'],
  },
  'complex array': {
    a: [1, { x: { y: 2, z: 3, x: [3, 6] } }, 5],
    b: [1, { x: { y: 2, z: 3, x: [3, 6] } }, 5],
  },
  'object': {
    a: { x: 1, y: 2 },
    b: { x: 1, y: 2 },
  },
  'complex object': {
    a: {
      x: {
        y: {
          z: [3, 6],
          p: [
            {
              m: 6,
            },
          ],
        },
      },
    },
    b: {
      x: {
        y: {
          z: [3, 6],
          p: [
            {
              m: 6,
            },
          ],
        },
      },
    },
  },
  'object without prototype': {
    a: Object.create(null),
    b: Object.create(null),
  },
};
