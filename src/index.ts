// 模型中使用
export { defineModel } from './model/define-model';
export { cloneModel } from './model/clone-model';

// 组件中使用
export { useModel } from './api/use-model';
export { useLoading } from './api/use-loading';
export { getLoading } from './api/get-loading';
export { useComputed } from './api/use-computed';
export { useIsolate } from './api/use-isolate';
export { connect } from './redux/connect';

// 入口使用
export { compose } from 'redux';
export { modelStore as store } from './store/model-store';
export { FocaProvider } from './redux/foca-provider';
export { engines } from './engines';
export { memoryStorage } from './engines/memory';

// 可能用到的TS类型
export type {
  Action,
  UnknownAction,
  Dispatch,
  MiddlewareAPI,
  Middleware,
  StoreEnhancer,
  Unsubscribe,
} from 'redux';
export type { Model } from './model/types';
export type { StorageEngine } from './engines/storage-engine';
