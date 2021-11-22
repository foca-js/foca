import { createStore } from 'redux';
import { metaStore } from './metaStore';
import { modelStore } from './modelStore';

export const emptyStore = createStore(() => ({}));

const dispatch = () => {
  emptyStore.dispatch({
    type: '-',
  });
};

metaStore.subscribe(dispatch);
modelStore.onReady(() => {
  modelStore.subscribe(dispatch);
});
