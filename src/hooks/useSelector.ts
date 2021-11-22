import { createSelectorHook } from 'react-redux';
import { ModelContext, MetaContext } from '../react/Context';

export const useModelSelector = createSelectorHook(ModelContext);

export const useMetaSelector = createSelectorHook(MetaContext);
