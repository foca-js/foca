import { useEffect, useMemo, useState } from 'react';
import { DestroyLodingAction, DESTROY_LOADING } from '../actions/loading';
import { loadingStore } from '../store/loadingStore';
import { ModelStore, modelStore } from '../store/modelStore';
import { cloneModel } from './cloneModel';
import { HookModel as HookModel, Model } from './types';

let nameCounter = 0;
const hotReloadCounter: Record<string, number> = {};

export const useDefined = <
  State extends object = object,
  Action extends object = object,
  Effect extends object = object,
  Computed extends object = object,
>(
  globalModel: Model<string, State, Action, Effect, Computed>,
): HookModel<string, State, Action, Effect, Computed> => {
  const modelName = globalModel.name;
  const initialCount = useState(() => nameCounter++)[0];

  const uniqueName =
    process.env.NODE_ENV === 'production'
      ? useProdName(modelName, initialCount)
      : useDevName(modelName, initialCount, new Error());

  const hookModel = useMemo(() => {
    return cloneModel(uniqueName, globalModel);
  }, [uniqueName]);

  return hookModel as any;
};

const useProdName = (modelName: string, count: number) => {
  const uniqueName = modelName + '#' + count;

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
const useDevName = (modelName: string, count: number, err: Error) => {
  const componentName = useMemo((): string => {
    try {
      const stacks = err.stack!.split('\n');
      const innerNamePattern = new RegExp(`at\\s${useDefined.name}\\s\\(`, 'i');
      const componentNamePattern = /at\s(.+?)\s\(/i;

      for (let i = 0; i < stacks.length; ++i) {
        if (innerNamePattern.test(stacks[i]!)) {
          return stacks[i + 1]!.match(componentNamePattern)![1]!;
        }
      }
    } catch {}

    return 'Anonymous';
  }, [err.stack]);

  const uniqueName = `${componentName}:${count}:${modelName}`;

  useMemo(() => {
    hotReloadCounter[uniqueName] ||= 0;
    ++hotReloadCounter[uniqueName];
  }, [uniqueName]);

  useEffect(() => {
    const prev = hotReloadCounter[uniqueName];
    return () => {
      /**
       * 热更新时会重新执行一次useEffect
       * setTimeout可以让其他useEffect有充分的时间使用model
       *
       * 需要卸载模型的场景是：
       * 1. 组件hooks增减或者调换顺序（initialCount会自增）
       * 2. 组件卸载
       * 3. model.name变更
       */
      setTimeout(() => {
        const active = prev !== hotReloadCounter[uniqueName];
        active || unmountModel(uniqueName);
      });
    };
  }, [uniqueName]);

  return uniqueName;
};

const unmountModel = (modelName: string) => {
  ModelStore.removeReducer.call(modelStore, modelName);
  loadingStore.dispatch<DestroyLodingAction>({
    type: DESTROY_LOADING,
    model: modelName,
  });
};
