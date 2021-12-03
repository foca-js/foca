import { cloneModel, store } from '../src';
import { ModelError } from '../src/exceptions/ModelError';
import { basicModel } from './models/basic-model';
import { storeUnmount } from './utils/store';

let modelIndex = 0;

beforeEach(() => {
  store.init();
});

afterEach(() => {
  storeUnmount();
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
  expect(() => cloneModel(basicModel.name, basicModel)).toThrow(ModelError);
});

test('Reset cloned model state', () => {
  const model = cloneModel('model' + ++modelIndex, basicModel, {
    initialState: {
      count: 20,
      hello: 'cat',
    },
  });

  model.moreParams(3, 'earth');
  expect(model.state.count).toBe(23);
  expect(model.state.hello).toBe('cat, earth');

  model.reset();
  expect(model.state.count).toBe(20);
  expect(model.state.hello).toBe('cat');
});
