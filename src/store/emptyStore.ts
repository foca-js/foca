import { createStore, Store } from 'redux';
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

/**
 * 绑定项目里共存的状态库的store。同时满足下列条件才有意义：
 *
 * 1. 在项目中用到 connect() 高阶组件
 * <br>
 * 2. 共存库也是基于redux和react-redux
 */
export const combine = (otherStore: Store) => {
  otherStore.subscribe(dispatch);
};
