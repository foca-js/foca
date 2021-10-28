import { createSelectorHook } from 'react-redux';
import { ReduxContext } from '../react/Context';

export const useCustomSelector = createSelectorHook(ReduxContext);
