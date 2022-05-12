import React, { FC, useState, useEffect, ReactNode } from 'react';
import { modelStore } from '../store/modelStore';
import { isFunction } from '../utils/isType';

export interface PersistGateProps {
  loading?: ReactNode;
  children?: ReactNode | ((isReady: boolean) => ReactNode);
}

export const PersistGate: FC<PersistGateProps> = (props) => {
  const state = useState(false);
  const isReady = state[0];
  const { loading = null, children } = props;

  useEffect(() => {
    modelStore.onInitialized().then(() => {
      state[1](true);
    });
  }, []);

  if (process.env.NODE_ENV !== 'production') {
    if (loading && isFunction(children)) {
      console.error('[PersistGate] 当前children为函数类型，loading属性无效');
    }
  }

  return (
    <>
      {isFunction(children) ? children(isReady) : isReady ? children : loading}
    </>
  );
};
