import { parseState, stringifyState } from '../src/utils/serialize';

it('can clone basic data', () => {
  expect(
    parseState(
      stringifyState({
        x: 1,
        y: 'y',
        z: true,
      }),
    ),
  ).toMatchObject({
    x: 1,
    y: 'y',
    z: true,
  });
});

it('can clone complex data', () => {
  expect(
    parseState(
      stringifyState({
        x: 1,
        y: {
          z: [1, 2, '3'],
        },
      }),
    ),
  ).toMatchObject({
    x: 1,
    y: {
      z: [1, 2, '3'],
    },
  });
});

it('can clone null and undefined', () => {
  const data = {
    x: [
      undefined,
      1,
      {
        test: undefined,
        test1: 'hello',
      },
      null,
      undefined,
    ],
    y: null,
    z: undefined,
  };

  expect(stringifyState(data)).toMatchSnapshot();
  expect(parseState(stringifyState(data))).toMatchSnapshot();
  expect(parseState(stringifyState(data))).toMatchObject(data);
});
