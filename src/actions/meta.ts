import { DispatchAction } from './dispatch';

export interface Meta {
  message?: string;
}

export type MetaType = 'pending' | 'resolved' | 'rejected';

export const META_DEFAULT_CATEGORY = '##' + Math.random();

export interface MetaStateItem extends Meta {
  type?: MetaType;
}

export interface MetaAction extends DispatchAction<object, MetaStateItem> {
  setMeta: true;
  category: string | number;
}
