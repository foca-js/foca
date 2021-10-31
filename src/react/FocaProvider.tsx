import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { ReduxContext } from './Context';
import { store } from '../store/StoreAdvanced';
import { PersistGate, PersistGateProps } from '../persist/PersistGate';

interface OwnProps extends PersistGateProps {}

/**
 * 状态上下文组件，请挂载到入口文件。
 * 请确保您已经初始化了store仓库。
 *
 * @see store.init()
 *
 * ```typescript
 * ReactDOM.render(
 *   <FocaProvider>
 *     <App />
 *   </FocaProvider>
 * );
 * ```
 */
export const FocaProvider: FC<OwnProps> = ({ children, loading }) => {
  return (
    <Provider context={ReduxContext} store={store}>
      {store.persistManager ? <PersistGate loading={loading} children={children} /> : children}
    </Provider>
  );
};
