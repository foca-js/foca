import { createContext } from 'react';
import type { ReactReduxContextValue } from 'react-redux';

export const ModelContext = createContext<ReactReduxContextValue | null>(null);

export const LoadingContext = createContext<ReactReduxContextValue | null>(
  null,
);

export const ProxyContext = createContext<ReactReduxContextValue | null>(null);
