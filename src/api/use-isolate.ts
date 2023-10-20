import { useEffect, useMemo, useRef, useState } from 'react';
import { DestroyLoadingAction, DESTROY_LOADING } from '../actions/loading';
import { loadingStore } from '../store/loading-store';
import { modelStore } from '../store/model-store';
import { cloneModel } from '../model/clone-model';
import { Model } from '../model/types';

let globalCounter = 0;
const hotReloadCounter: Record<string, number> = {};

/**
 * 创建局部模型，它的数据变化不会影响到全局模型，而且会随着组件一起销毁
 * ```typescript
 * const testModel = defineModel({
 *   initialState,
 *   events: {
 *     onInit() {},    // 挂载回调
 *     onDestroy() {}, // 销毁回调
 *   }
 * });
 *
 * function App() {
 *   const model = useIsolate(testModel);
 *   const state = useModel(model);
 *
 *   return <p>Hello</p>;
 * }
 * ```
 */
export const useIsolate = <
  State extends object = object,
  Action extends object = object,
  Effect extends object = object,
  Computed extends object = object,
>(
  globalModel: Model<string, State, Action, Effect, Computed>,
): Model<string, State, Action, Effect, Computed> => {
  const initialCount = useState(() => globalCounter++)[0];
  const uniqueName =
    process.env.NODE_ENV === 'production'
      ? useProdName(globalModel.name, initialCount)
      : useDevName(globalModel, initialCount, new Error());

  const localModelRef = useRef<typeof globalModel>();
  useEffect(() => {
    localModelRef.current = isolateModel;
  });

  // 热更时会重新执行useMemo，因此只能用ref
  const isolateModel =
    localModelRef.current?.name === uniqueName
      ? localModelRef.current
      : cloneModel(uniqueName, globalModel);

  return isolateModel;
};

const useProdName = (modelName: string, count: number) => {
  const uniqueName = `@isolate:${modelName}#${count}`;

  useEffect(
    () => () => {
      setTimeout(unmountModel, 0, uniqueName);
    },
    [uniqueName],
  );

  return uniqueName;
};

/**
 * 开发模式下，需要Hot Reload。
 * 必须保证数据不会丢，即如果用户一直保持`model.name`不变，就被判定为可以共享热更新之前的数据。
 *
 * 必须严格控制count在组件内的自增次数，否则在第一次修改model的name时，总是会报错：
 * Warning: Cannot update a component (`XXX`) while rendering a different component (`XXX`)
 */
const useDevName = (model: Model, count: number, err: Error) => {
  const componentName = useMemo((): string => {
    try {
      const stacks = err.stack!.split('\n');
      const innerNamePattern = new RegExp(
        // vitest测试框架的stack增加了 Module.
        `at\\s(?:Module\\.)?${useIsolate.name}\\s\\(`,
        'i',
      );
      const componentNamePattern = /at\s(.+?)\s\(/i;
      for (let i = 0; i < stacks.length; ++i) {
        if (innerNamePattern.test(stacks[i]!)) {
          return stacks[i + 1]!.match(componentNamePattern)![1]!;
        }
      }
    } catch {}
    return 'Component';
  }, [err.stack]);

  /**
   * 模型文件重新保存时组件会导入新的对象，需根据这个特性重新克隆模型
   */
  const globalModelRef = useRef<{ model?: Model; count: number }>({ count: 0 });
  useEffect(() => {
    if (globalModelRef.current.model !== model) {
      globalModelRef.current = { model, count: ++globalModelRef.current.count };
    }
  });

  const uniqueName = `@isolate:${model.name}:${componentName}#${count}-${
    globalModelRef.current.count +
    Number(globalModelRef.current.model !== model)
  }`;

  /**
   * 计算热更次数，如果停止热更，说明组件被卸载
   */
  useMemo(() => {
    hotReloadCounter[uniqueName] ||= 0;
    ++hotReloadCounter[uniqueName];
  }, [uniqueName]);

  /**
   * 热更新时会重新执行一次useEffect
   * setTimeout可以让其他useEffect有充分的时间使用model
   *
   * 需要卸载模型的场景是：
   * 1. 组件hooks增减或者调换顺序（initialCount会自增）
   * 2. 组件卸载
   * 3. model.name变更
   * 4. model逻辑变更
   */
  useEffect(() => {
    const prev = hotReloadCounter[uniqueName];
    return () => {
      setTimeout(() => {
        const unmounted = prev === hotReloadCounter[uniqueName];
        unmounted && unmountModel(uniqueName);
      });
    };
  }, [uniqueName]);

  return uniqueName;
};

const unmountModel = (modelName: string) => {
  modelStore['removeReducer'](modelName);
  loadingStore.dispatch<DestroyLoadingAction>({
    type: DESTROY_LOADING,
    model: modelName,
  });
};
