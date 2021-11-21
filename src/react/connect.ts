import { Connect, connect as originalConnect } from 'react-redux';
import isEqual from 'lodash.isequal';
import { ReduxContext } from './Context';
import { toArgs } from '../utils/toArgs';

export const connect: Connect = function () {
  const [mapState, mapDispatch, mergeProps, options = {}] =
    toArgs<Parameters<Connect>>(arguments);

  options.context ||= ReduxContext;
  options.areStatePropsEqual ||= isEqual;

  return originalConnect(mapState, mapDispatch, mergeProps, options);
};
