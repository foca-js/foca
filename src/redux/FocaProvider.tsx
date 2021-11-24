import React, { FC } from 'react';
import { Provider } from 'react-redux';
import { EmptyContext, ModelContext, MetaContext } from './contexts';
import { modelStore } from '../store/modelStore';
import { PersistGate, PersistGateProps } from '../persist/PersistGate';
import { emptyStore } from '../store/emptyStore';
import { metaStore } from '../store/metaStore';

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
    <Provider context={EmptyContext} store={emptyStore}>
      <Provider context={MetaContext} store={metaStore}>
        <Provider context={ModelContext} store={modelStore}>
          {modelStore.persistManager ? (
            <PersistGate loading={loading} children={children} />
          ) : (
            children
          )}
        </Provider>
      </Provider>
    </Provider>
  );
};
