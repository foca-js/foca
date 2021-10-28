import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { ReduxContext } from './Context';
import { store } from '../store/StoreAdvanced';

/**
 * 状态上下文组件，请挂载到入口文件。
 * 请确保您已经初始化了store仓库。
 *
 * @see store.init()
 *
 * ```typescript
 * ReactDOM.render(
 *   <ReduxProvider>
 *     <App />
 *   </ReduxProvider>
 * );
 * ```
 */
export const ReduxProvider: FC = ({ children }) => {
  return <Provider context={ReduxContext} store={store} children={children} />;
};
