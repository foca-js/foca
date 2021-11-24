import { createSelectorHook } from 'react-redux';
import { ModelContext, MetaContext } from './contexts';

export const useModelSelector = createSelectorHook(ModelContext);

export const useMetaSelector = createSelectorHook(MetaContext);
