import { MetaManager } from '../reducers/MetaManger';
import { StoreAdvanced } from './StoreAdvanced';

export const metaStore = new StoreAdvanced().init();

export const metaManager = new MetaManager(metaStore);

metaStore.appendReducer(metaManager);
