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
  fromGlobalModel: Model<string, State, Action, Effect, Computed>,
): HookModel<string, State, Action, Effect, Computed> => {
  const hookModel = React.useMemo(() => {
    return cloneModel(
      fromGlobalModel.name + '#' + nameCounter++,
      fromGlobalModel,
    );
  }, [fromGlobalModel]);

  React.useEffect(() => {
    const modelName = hookModel.name;
    return () => {
      // 尽量延迟一下，防止业务中的useEffect有对模型的操作
      setTimeout(() => {
        modelStore.removeReducer(modelName);
        loadingStore.dispatch<DestroyLodingAction>({
          type: DESTROY_LOADING,
          model: modelName,
        });
      });
    };
  }, [hookModel]);

  return hookModel as any;
};
