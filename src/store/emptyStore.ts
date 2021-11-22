import { createStore } from 'redux';
import { metaStore } from './metaStore';
import { modelStore } from './modelStore';

export const emptyStore = createStore(() => ({}));

let prevModelState: object = metaStore.getState();
let prevMetaState: object;

const dispatch = () => {
  emptyStore.dispatch({
    type: '-',
  });
};

metaStore.subscribe(() => {
  const nextState = metaStore.getState();

  if (prevMetaState !== nextState) {
    prevMetaState = nextState;
    dispatch();
  }
});

modelStore.onReady(() => {
  prevModelState = modelStore.getState();

  modelStore.subscribe(() => {
    const nextState = modelStore.getState();
    if (prevModelState !== nextState) {
      prevModelState = nextState;
      dispatch();
    }
  });
});
