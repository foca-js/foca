import { createSelectorHook } from 'react-redux';
import { ReduxContext } from '../overrides/Context';

export const useSelector = createSelectorHook(ReduxContext);
