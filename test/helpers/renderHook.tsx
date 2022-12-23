import { renderHook as originRenderHook } from '@testing-library/react';
import { FocaProvider } from '../../src';

export const renderHook: typeof originRenderHook = (
  renderCallback,
  options,
) => {
  return originRenderHook(renderCallback, {
    wrapper: FocaProvider,
    ...options,
  });
};
