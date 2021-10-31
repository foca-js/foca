import { DispatchAction } from '../model/ActionManager';

export const ACTION_TYPE_HYDRATE_META = '@@meta/hydrate';

export interface HydrateMetaAction extends DispatchAction {
  type: typeof ACTION_TYPE_HYDRATE_META;
}
