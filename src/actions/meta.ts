import { DispatchAction } from './dispatch';

export interface Meta {
  message?: string;
}

export type MetaType = 'pending' | 'resolved' | 'rejected';

export interface MetaStateItem extends Meta {
  type?: MetaType;
}

export interface MetaAction extends DispatchAction<object, MetaStateItem> {
  setMeta: true;
}
