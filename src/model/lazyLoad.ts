import { modelStore, ModelStore } from '../store/modelStore';

export function lazyLoad(modelName: string): void {
  ModelStore.lazyLoad.call(modelStore, modelName);
}
