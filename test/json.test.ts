import isEqual from 'lodash.isequal';
import { parsePersist, stringifyPersist } from '../src/utils/json';

test('json string and Map/Set can transform to each', () => {
  const map = new Map();
  map.set('aa', 'bb');
  map.set('cc', 2);

  const set = new Set();
  set.add(1);
  set.add(4);
  set.add('555');

  const obj = {
    a: 1,
    b: 'test-me',
    c: {
      def: 'ts2',
      test2: map,
      test5: {
        data: set,
      },
    },
    test3: set,
    test4: map,
  };

  const str = stringifyPersist(obj);

  expect(typeof str).toBe('string');
  expect(str).toMatchSnapshot('Map/Set string');

  const nextObj = parsePersist(str);
  expect(typeof nextObj).toBe('object');
  expect(nextObj).toMatchSnapshot('Map/Set object');
  expect(isEqual(obj, nextObj)).toBeTruthy();
});
