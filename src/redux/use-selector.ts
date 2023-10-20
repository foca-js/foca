import { createSelectorHook } from 'react-redux';
import { ModelContext, LoadingContext } from './contexts';

export const useModelSelector = createSelectorHook(ModelContext);

export const useLoadingSelector = createSelectorHook(LoadingContext);
