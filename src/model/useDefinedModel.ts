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
  const count = React.useMemo(() => nameCounter++, [modelName]);
  const uniqueName =
    process.env.NODE_ENV === 'production'
      ? useProdName(modelName, count)
      : useDevName(modelName, count);

  const hookModel = React.useMemo(() => {
    return cloneModel(uniqueName, globalModel);
  }, [uniqueName]);

  return hookModel as any;
};

const useProdName = (modelName: string, count: number) => {
  const uniqueName = concatUniqueName(modelName, count);

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
 */
const useDevName = (modelName: string, count: number) => {
  const [cache, setCache] = React.useState(() => ({
    name: modelName,
    count: count,
  }));

  const nextCount = cache.name === modelName ? cache.count : nameCounter++;
  const uniqueName = concatUniqueName(modelName, nextCount);

  React.useEffect(() => {
    if (cache.name !== modelName || cache.count !== nextCount) {
      setCache({
        name: modelName,
        count: nextCount,
      });
    }
  }, [modelName, nextCount]);

  React.useMemo(() => {
    timesCounter[uniqueName] ||= 0;
    ++timesCounter[uniqueName];
  }, [uniqueName]);

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

const concatUniqueName = (modelName: string, count: number) => {
  return modelName + '#' + count;
};

const unmountModel = (modelName: string) => {
  modelStore.removeReducer(modelName);
  loadingStore.dispatch<DestroyLodingAction>({
    type: DESTROY_LOADING,
    model: modelName,
  });
};
