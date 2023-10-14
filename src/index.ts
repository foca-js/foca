// 模型中使用
export { defineModel } from './model/defineModel';
export { cloneModel } from './model/cloneModel';

// 组件中使用
export { useModel } from './model/useModel';
export { useLoading } from './api/useLoading';
export { getLoading } from './api/getLoading';
export { useComputed } from './api/use-computed';
export { connect } from './redux/connect';

// 入口使用
export { compose } from 'redux';
export { modelStore as store } from './store/modelStore';
export { FocaProvider } from './redux/FocaProvider';
export { engines } from './engines';
export { memoryStorage } from './engines/memory';

// 可能用到的TS类型
export type {
  Action,
  AnyAction,
  Dispatch,
  MiddlewareAPI,
  Middleware,
  PreloadedState,
  StoreEnhancer,
  Unsubscribe,
} from 'redux';
export type { Model } from './model/types';
export type { StorageEngine } from './engines/StorageEngine';
export type { ComputedRef } from './reactive/types';
