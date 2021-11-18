import { DispatchAction } from './dispatch';

export interface Meta {
  message?: string;
}

export interface MetaStateItem extends Meta {
  loading: boolean;
}

export interface MetaAction extends DispatchAction<object, MetaStateItem> {
  setMeta: true;
}
