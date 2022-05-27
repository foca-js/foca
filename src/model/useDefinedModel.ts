import React from 'react';
import { DestroyLodingAction, DESTROY_LOADING } from '../actions/loading';
import { loadingStore } from '../store/loadingStore';
import { modelStore } from '../store/modelStore';
import { cloneModel } from './cloneModel';
import { HookModel as HookModel, Model } from './types';

let nameCounter = 0;
let timesCounter: Record<string, number> = {};

export const useDefinedModel = <
  State extends object = object,
  Action extends object = object,
  Effect extends object = object,
  Computed extends object = object,
>(
  globalModel: Model<string, State, Action, Effect, Computed>,
): HookModel<string, State, Action, Effect, Computed> => {
  const modelName = globalModel.name;
  const initialCount = React.useState(() => nameCounter++)[0];

  const uniqueName =
    process.env.NODE_ENV === 'production'
      ? useProdName(modelName, initialCount)
      : useDevName(modelName, initialCount, new Error());

  const hookModel = React.useMemo(() => {
    return cloneModel(uniqueName, globalModel);
  }, [uniqueName]);

  return hookModel as any;
};

const useProdName = (modelName: string, count: number) => {
  const uniqueName = modelName + '#' + count;

  React.useEffect(
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
  const [cache, setCache] = React.useState({
    name: modelName,
    count: count,
  });

  const componentName = React.useMemo((): string => {
    try {
      const stacks = err.stack!.split('\n');

      const innerNamePattern = new RegExp(
        `at\\s${useDefinedModel.name}\\s\\(`,
        'i',
      );
      const componentNamePattern = /at\s(.+?)\s\(/i;

      for (let i = 0; i < stacks.length; ++i) {
        if (innerNamePattern.test(stacks[i]!)) {
          return stacks[i + 1]!.match(componentNamePattern)![1]!;
        }
      }
    } catch {}

    return 'Anonymous';
  }, []);

  const uniqueName = `${componentName}:${count}:${modelName}`;

  React.useMemo(() => {
    timesCounter[uniqueName] ||= 0;
    ++timesCounter[uniqueName];
  }, [uniqueName]);

  React.useEffect(() => {
    if (cache.name !== modelName || cache.count !== count) {
      setCache({
        name: modelName,
        count: count,
      });
    }
  }, [modelName, count]);

  React.useEffect(() => {
    const currentTimes = timesCounter[uniqueName];
    return () => {
      setTimeout(() => {
        if (currentTimes === timesCounter[uniqueName]) {
          unmountModel(uniqueName);
        }
      });
    };
  }, [uniqueName]);

  return uniqueName;
};

const unmountModel = (modelName: string) => {
  modelStore.removeReducer(modelName);
  loadingStore.dispatch<DestroyLodingAction>({
    type: DESTROY_LOADING,
    model: modelName,
  });
};
