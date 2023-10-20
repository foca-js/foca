import { legacy_createStore as createStore, Store } from 'redux';

export const proxyStore = createStore(() => ({}));

const dispatch = () => {
  proxyStore.dispatch({
    type: '-',
  });
};

/**
 * 为了触发connect()，需要将实体store都注册到代理的store。
 */
export const combine = (otherStore: Store) => {
  otherStore.subscribe(dispatch);
};
