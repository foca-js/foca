import { createStore } from 'redux';
import { metaStore } from './metaStore';
import { modelStore } from './modelStore';

const initialState = {};

export const emptyStore = createStore(() => initialState);

const dispatch = () => {
  emptyStore.dispatch({
    type: '-',
  });
};

metaStore.subscribe(dispatch);
modelStore.onReady(() => {
  modelStore.subscribe(dispatch);
});
