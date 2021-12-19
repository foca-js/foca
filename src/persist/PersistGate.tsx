import { FC, ReactNode, useState, useEffect } from 'react';
import { modelStore } from '../store/modelStore';

export interface PersistGateProps {
  loading?: ReactNode;
}

export const PersistGate: FC<PersistGateProps> = (props) => {
  const [isReady, setIsReady] = useState(false);
  const { loading = null, children } = props;
  const isChildrenFunction = typeof children === 'function';

  useEffect(() => {
    modelStore.onInitialized().then(() => {
      setIsReady(true);
    });
  }, []);

  if (process.env.NODE_ENV !== 'production') {
    if (loading && isChildrenFunction) {
      console.error(
        'PersistGate expects either a function child or loading prop. The loading prop will be ignored.',
      );
    }
  }

  if (isChildrenFunction) {
    return children(isReady);
  }

  return isReady ? children : loading;
};
