import { deepEqual } from '../src/utils/deep-equal';
import { equals } from './fixtures/equals';
import { notEquals } from './fixtures/not-equals';

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
