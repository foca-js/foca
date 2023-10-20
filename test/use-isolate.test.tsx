import { act, cleanup, render } from '@testing-library/react';
import { useEffect, useState } from 'react';
import sleep from 'sleep-promise';
import {
  defineModel,
  FocaProvider,
  store,
  useLoading,
  useIsolate,
  Model,
  useModel,
} from '../src';
import { loadingStore } from '../src/store/loading-store';
import { renderHook } from './helpers/render-hook';
import { basicModel } from './models/basic.model';

(['development', 'production'] as const).forEach((env) => {
  describe(`[${env} mode]`, () => {
    beforeEach(() => {
      store.init();
      process.env.NODE_ENV = env;
    });

    afterEach(async () => {
      process.env.NODE_ENV = 'testing';
      cleanup();
      await sleep(10);
      store.unmount();
    });

    test('can register to modelStore and remove from modelStore', async () => {
      const { result, unmount } = renderHook(() => useIsolate(basicModel));

      expect(result.current).not.toBe(basicModel);
      expect(store.getState()).toHaveProperty(
        result.current.name,
        result.current.state,
      );

      unmount();
      await sleep(1);
      expect(store.getState()).not.toHaveProperty(result.current.name);
    });

    test('can register to loadingStore and remove from loadingStore', async () => {
      const { result, unmount } = renderHook(() => {
        const model = useIsolate(basicModel);
        useLoading(basicModel.pureAsync);
        useLoading(model.pureAsync);

        return model;
      });

      const key1 = `${result.current.name}.pureAsync`;
      const key2 = `${basicModel.name}.pureAsync`;
      expect(loadingStore.getState()).not.toHaveProperty(key1);

      await act(async () => {
        const promise1 = result.current.pureAsync();
        const promise2 = basicModel.pureAsync();

        expect(loadingStore.getState()).toHaveProperty(key1);
        expect(loadingStore.getState()).toHaveProperty(key2);

        await promise1;
        await promise2;
      });

      expect(loadingStore.getState()).toHaveProperty(key1);
      expect(loadingStore.getState()).toHaveProperty(key2);

      unmount();
      await sleep(1);
      expect(loadingStore.getState()).not.toHaveProperty(key1);
      expect(loadingStore.getState()).toHaveProperty(key2);
    });

    test('call onDestroy event when local model is destroyed', async () => {
      const spy = vitest.fn();
      const globalModel = defineModel('isolate-demo-1', {
        initialState: {},
        events: {
          onDestroy: spy,
        },
      });

      const { unmount } = renderHook(() => useIsolate(globalModel));

      expect(spy).toBeCalledTimes(0);
      unmount();
      await sleep(1);
      expect(spy).toBeCalledTimes(1);
      basicModel.plus(1);
      expect(spy).toBeCalledTimes(1);
    });

    test('recreate isolated model when global model changed', async () => {
      const globalModel = defineModel('isolate-demo-2', {
        initialState: {},
      });

      const { result } = renderHook(() => {
        const [state, setState] = useState<Model>(basicModel);

        const model = useIsolate(state);

        useEffect(() => {
          setTimeout(() => {
            setState(globalModel);
          }, 20);
        }, []);

        return model;
      });

      const name1 = result.current.name;
      expect(name1).toMatch(basicModel.name);
      expect(store.getState()).toHaveProperty(name1);

      await act(async () => {
        await sleep(30);
      });

      await sleep(10);

      expect(result.current.name).not.toBe('isolate-demo-2');
      expect(result.current.name).toMatch('isolate-demo-2');
      expect(store.getState()).not.toHaveProperty(name1);
    });

    test.runIf(env === 'development')(
      'Can get component name in dev mode',
      () => {
        let model!: Model;
        function MyApp() {
          model = useIsolate(basicModel);
          return null;
        }

        render(
          <FocaProvider>
            <MyApp />
          </FocaProvider>,
        );

        expect(model.name).toMatch('MyApp#');
      },
    );

    test('can use with global model', async () => {
      let model: typeof basicModel;
      const { result } = renderHook(() => {
        // @ts-expect-error
        model = useIsolate(basicModel);
        return useModel(model, basicModel, (local, basic) => {
          return `local: ${local.count}, basic: ${basic.count}`;
        });
      });

      expect(result.current).toBe('local: 0, basic: 0');
      act(() => {
        basicModel.plus(12);
      });
      expect(result.current).toBe('local: 0, basic: 12');
      act(() => {
        model.plus(7);
      });
      expect(result.current).toBe('local: 7, basic: 12');
    });

    test('can isolate from isolate model', async () => {
      let model1: typeof basicModel;
      let model2: typeof basicModel;
      const { result } = renderHook(() => {
        // @ts-expect-error
        model1 = useIsolate(basicModel);
        // @ts-expect-error
        model2 = useIsolate(model1);
        return useModel(model1, model2, (local1, local2) => {
          return `local1: ${local1.count}, local2: ${local2.count}`;
        });
      });

      expect(result.current).toBe('local1: 0, local2: 0');
      act(() => {
        model1.plus(12);
      });
      expect(result.current).toBe('local1: 12, local2: 0');
      act(() => {
        model2.plus(7);
      });
      expect(result.current).toBe('local1: 12, local2: 7');
    });
  });
});
