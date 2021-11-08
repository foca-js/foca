import { DispatchAction } from './dispatch';

export const TYPE_HYDRATE_META = '@@meta/hydrate';

export interface Meta {
  message?: string;
}

export interface MetaStateItem extends Meta {
  loading: boolean;
}

export interface HydrateMetaAction extends DispatchAction {
  type: typeof TYPE_HYDRATE_META;
}

export interface MetaAction extends DispatchAction<object, MetaStateItem> {
  setMeta: true;
}
