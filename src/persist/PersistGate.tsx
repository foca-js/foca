import { FC, useState, useEffect } from 'react';
import { modelStore } from '../store/modelStore';

type FCReturn = ReturnType<FC>;

export interface PersistGateProps {
  loading?: FCReturn;
  children?: FCReturn | ((isReady: boolean) => FCReturn);
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

  if (typeof children === 'function') {
    return children(isReady);
  }

  return isReady ? children ?? null : loading;
};
