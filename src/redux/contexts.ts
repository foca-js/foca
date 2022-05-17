import React from 'react';
import type { ReactReduxContextValue } from 'react-redux';

export const ModelContext = React.createContext<ReactReduxContextValue>(
  // @ts-expect-error
  null,
);

export const LoadingContext = React.createContext<ReactReduxContextValue>(
  // @ts-expect-error
  null,
);

export const ProxyContext = React.createContext<ReactReduxContextValue>(
  // @ts-expect-error
  null,
);
