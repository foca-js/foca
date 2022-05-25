import { Connect, connect as originalConnect } from 'react-redux';
import { ProxyContext } from './contexts';
import { toArgs } from '../utils/toArgs';

export const connect: Connect = function () {
  const args = toArgs<Parameters<Connect>>(arguments);
  (args[3] ||= {}).context = ProxyContext;

  return originalConnect.apply(null, args);
};
