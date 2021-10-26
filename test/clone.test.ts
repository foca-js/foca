import { cloneModel, store } from '../src';
import { DuplicateModelError } from '../src/exceptions/DuplicateModelError';
import { basicModel } from './mock/basic-model';

let modelIndex = 0;

beforeEach(() => {
  store.init({});
});

afterEach(() => {
  store.refresh(true);
});

test('Model can be cloned', async () => {
  const model = cloneModel('model' + ++modelIndex, basicModel);

  expect(model.state.hello).toBe('world');
  expect(model.state.count).toBe(0);

  model.plus(11);
  expect(model.state.count).toBe(11);

  await expect(model.foo('earth', 5)).resolves.toBe('OK');
  expect(model.state.hello).toBe('earth');
  expect(model.state.count).toBe(16);
});

test('Cloned model name', () => {
  const model = cloneModel('model' + ++modelIndex, basicModel);
  expect(model.name).toBe('model' + modelIndex);
});

test('Clone model with same name is invalid', () => {
  expect(() => cloneModel(basicModel.name, basicModel)).toThrowError(DuplicateModelError);
});

test.todo('Reset cloned model state');
