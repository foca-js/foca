// 模型中使用
export { defineModel } from './model/defineModel';
export { cloneModel } from './model/cloneModel';

// 组件中使用
export { useModel } from './api/useModel';
export { useLoading } from './api/useLoading';
export { getLoading } from './api/getLoading';
export { connect } from './api/connect';
export { useComputed } from './api/useComputed';

// 入口使用
export { compose } from 'redux';
export { modelStore as store } from './store/modelStore';
export { FocaProvider } from './redux/FocaProvider';
export { engines } from './engines';

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
export type { StorageEngine } from './engines';
export type { ComputedRef } from './reactive/types';
