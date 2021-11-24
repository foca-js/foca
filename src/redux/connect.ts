import { Connect, connect as originalConnect } from 'react-redux';
import { EmptyContext } from './contexts';
import { toArgs } from '../utils/toArgs';

export const connect: Connect = function () {
  const [mapState, mapDispatch, mergeProps, options = {}] =
    toArgs<Parameters<Connect>>(arguments);

  options.context ||= EmptyContext;

  return originalConnect(mapState, mapDispatch, mergeProps, options);
};
