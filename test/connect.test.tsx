import React from 'react';
import { FC } from 'react';
import { act, create } from 'react-test-renderer';
import { store, connect, FocaProvider, getLoading } from '../src';
import { basicModel } from './models/basic-model';
import { complexModel } from './models/complex-model';

let App: FC<ReturnType<typeof mapStateToProps>> = ({ count, loading }) => {
  return (
    <>
      <div id="count">{count}</div>
      <div id="loading">{loading.toString()}</div>
    </>
  );
};

const mapStateToProps = () => {
  return {
    count: basicModel.state.count + complexModel.state.ids.size,
    loading: getLoading(basicModel.pureAsync),
  };
};

const Wrapped = connect(mapStateToProps)(App);

const Root: FC = () => {
  return (
    <FocaProvider>
      <Wrapped />
    </FocaProvider>
  );
};

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('Get state from connect', async () => {
  const dom = create(<Root />);
  const $count = dom.root.findByProps({ id: 'count' });
  const $loading = dom.root.findByProps({ id: 'loading' });

  expect($count.children[0]).toBe('0');
  expect($loading.children[0]).toBe('false');

  act(() => {
    basicModel.plus(1);
  });
  expect($count.children[0]).toBe('1');

  act(() => {
    basicModel.plus(20.5);
  });
  expect($count.children[0]).toBe('21.5');

  act(() => {
    complexModel.addUser(40, '');
  });
  expect($count.children[0]).toBe('22.5');

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync();
  });
  expect($loading.children[0]).toBe('true');

  await act(async () => {
    await promise;
  });
  expect($loading.children[0]).toBe('false');

  dom.unmount();
});
