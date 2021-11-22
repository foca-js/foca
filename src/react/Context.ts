import { createContext } from 'react';
import { ReactReduxContextValue } from 'react-redux';

export const ModelContext = createContext<ReactReduxContextValue>(
  // @ts-expect-error
  null,
);

export const MetaContext = createContext<ReactReduxContextValue>(
  // @ts-expect-error
  null,
);

export const EmptyContext = createContext<ReactReduxContextValue>(
  // @ts-expect-error
  null,
);
