import { DispatchAction } from '../model/ActionManager';

export const TYPE_HYDRATE_META = '@@meta/hydrate';

export interface HydrateMetaAction extends DispatchAction {
  type: typeof TYPE_HYDRATE_META;
}
