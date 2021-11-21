import { Connect, connect as originalConnect } from 'react-redux';
import isEqual from 'lodash.isequal';
import { ReduxContext } from './Context';
import { getArgs } from '../utils/getArgs';

export const connect: Connect = function () {
  const [mapState, mapDispatch, mergeProps, options = {}] =
    getArgs<Parameters<Connect>>(arguments);

  options.context ||= ReduxContext;
  options.areStatePropsEqual ||= isEqual;

  return originalConnect(mapState, mapDispatch, mergeProps, options);
};
