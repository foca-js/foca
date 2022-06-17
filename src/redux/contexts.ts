import { createContext } from 'react';
import type { ReactReduxContextValue } from 'react-redux';

export const ModelContext = createContext<ReactReduxContextValue>(
  // @ts-expect-error
  null,
);

export const LoadingContext = createContext<ReactReduxContextValue>(
  // @ts-expect-error
  null,
);

export const ProxyContext = createContext<ReactReduxContextValue>(
  // @ts-expect-error
  null,
);
