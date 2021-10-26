import { Connect, connect as originalConnect } from 'react-redux';
import { ReduxContext } from './Context';

// @ts-ignore
export const connect: Connect = (...args: Parameters<Connect>) => {
  const [mapStateToProps, mapDispatchToProps, mergeProps, options = {}] = args;
  options.context ||= ReduxContext;
  return originalConnect(mapStateToProps, mapDispatchToProps, mergeProps, options);
};
