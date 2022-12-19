import { FC } from 'react';
import { Provider } from 'react-redux';
import { ProxyContext, ModelContext, LoadingContext } from './contexts';
import { modelStore } from '../store/modelStore';
import { PersistGate, PersistGateProps } from '../persist/PersistGate';
import { proxyStore } from '../store/proxyStore';
import { loadingStore } from '../store/loadingStore';
import { isFunction } from '../utils/isType';

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
    <Provider context={ProxyContext} store={proxyStore}>
      <Provider context={LoadingContext} store={loadingStore}>
        <Provider context={ModelContext} store={modelStore}>
          {modelStore.persistor ? (
            <PersistGate loading={loading} children={children} />
          ) : isFunction(children) ? (
            children(true)
          ) : (
            children
          )}
        </Provider>
      </Provider>
    </Provider>
  );
};
