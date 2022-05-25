import React from 'react';
import { DestroyLodingAction, DESTROY_LOADING } from '../actions/loading';
import { loadingStore } from '../store/loadingStore';
import { modelStore } from '../store/modelStore';
import { cloneModel } from './cloneModel';
import { HookModel as HookModel, Model } from './types';

let nameCounter = 0;

export const useDefinedModel = <
  State extends object = object,
  Action extends object = object,
  Effect extends object = object,
  Computed extends object = object,
>(
  globalModel: Model<string, State, Action, Effect, Computed>,
): HookModel<string, State, Action, Effect, Computed> => {
  const hookModel = React.useMemo(() => {
    return cloneModel(globalModel.name + '#' + nameCounter++, globalModel);
  }, [globalModel]);

  React.useEffect(() => {
    const modelName = hookModel.name;
    return () => {
      // 在开发环境中有热更新，setTimeout延迟做会导致卸载失败
      modelStore.removeReducer(modelName);
      loadingStore.dispatch<DestroyLodingAction>({
        type: DESTROY_LOADING,
        model: modelName,
      });
    };
  }, [hookModel]);

  return hookModel as any;
};
