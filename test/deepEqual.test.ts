import { deepEqual } from '../src/utils/deepEqual';
import { equals } from './fixtures/equals';
import { notEquals } from './fixtures/notEquals';

Object.entries(equals).map(([title, { a, b }]) => {
  test(`[equal] ${title}`, () => {
    expect(deepEqual(a, b)).toBeTruthy();
  });
});

Object.entries(notEquals).map(([title, { a, b }]) => {
  test(`[not equal] ${title}`, () => {
    expect(deepEqual(a, b)).toBeFalsy();
  });
});
