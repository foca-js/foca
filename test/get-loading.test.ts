import sleep from 'sleep-promise';
import { defineModel, getLoading, store } from '../src';
import { basicModel } from './models/basic.model';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('Collect loading status for method', async () => {
  expect(getLoading(basicModel.bos)).toBeFalsy();
  const promise = basicModel.bos();
  expect(getLoading(basicModel.bos)).toBeTruthy();
  await promise;
  expect(getLoading(basicModel.bos)).toBeFalsy();
});

test('Collect error message for method', async () => {
  expect(getLoading(basicModel.hasError)).toBeFalsy();

  const promise = basicModel.hasError();
  expect(getLoading(basicModel.hasError)).toBeTruthy();

  await expect(promise).rejects.toThrowError('my-test');

  expect(getLoading(basicModel.hasError)).toBeFalsy();
});

test('Trace loadings', async () => {
  expect(getLoading(basicModel.bos.room, 'x')).toBeFalsy();
  expect(getLoading(basicModel.bos.room).find('x')).toBeFalsy();

  const promise = basicModel.bos.room('x').execute();
  expect(getLoading(basicModel.bos.room, 'x')).toBeTruthy();
  expect(getLoading(basicModel.bos.room).find('x')).toBeTruthy();
  expect(getLoading(basicModel.bos.room, 'y')).toBeFalsy();
  expect(getLoading(basicModel.bos.room).find('y')).toBeFalsy();
  expect(getLoading(basicModel.bos)).toBeFalsy();

  await promise;
  expect(getLoading(basicModel.bos.room, 'x')).toBeFalsy();
  expect(getLoading(basicModel.bos.room).find('x')).toBeFalsy();
});

test('async method in model.onInit should be activated automatically', async () => {
  const hookModel = defineModel('loading' + Math.random(), {
    initialState: {},
    methods: {
      async myMethod() {
        await sleep(200);
      },
      async myMethod2() {
        await sleep(200);
      },
    },
    events: {
      async onInit() {
        await this.myMethod();
        await this.myMethod2();
      },
    },
  });
  await store.onInitialized();
  expect(getLoading(hookModel.myMethod)).toBeTruthy();
  await sleep(220);
  expect(getLoading(hookModel.myMethod)).toBeFalsy();

  expect(getLoading(hookModel.myMethod2)).toBeTruthy();
  await sleep(220);
  expect(getLoading(hookModel.myMethod2)).toBeFalsy();
});
