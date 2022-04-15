import React, { FC, useState, useEffect, ReactNode } from 'react';
import { modelStore } from '../store/modelStore';

export interface PersistGateProps {
  loading?: ReactNode;
  children?: ReactNode | ((isReady: boolean) => ReactNode);
}

export const PersistGate: FC<PersistGateProps> = (props) => {
  const [isReady, setIsReady] = useState(false);
  const { loading = null, children } = props;

  useEffect(() => {
    modelStore.onInitialized().then(() => {
      setIsReady(true);
    });
  }, []);

  if (process.env.NODE_ENV !== 'production') {
    if (loading && typeof children === 'function') {
      console.error(
        'PersistGate expects either a function child or loading prop. The loading prop will be ignored.',
      );
    }
  }

  return (
    <>
      {typeof children === 'function'
        ? children(isReady)
        : isReady
        ? children
        : loading}
    </>
  );
};
