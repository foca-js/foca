import { FC } from 'react';
import { act, render, screen } from '@testing-library/react';
import { store, connect, FocaProvider, getLoading } from '../src';
import { basicModel } from './models/basicModel';
import { complexModel } from './models/complexModel';

let App: FC<ReturnType<typeof mapStateToProps>> = ({ count, loading }) => {
  return (
    <>
      <div data-testid="count">{count}</div>
      <div data-testid="loading">{loading.toString()}</div>
    </>
  );
};

const mapStateToProps = () => {
  return {
    count: basicModel.state.count + complexModel.state.ids.length,
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
  render(<Root />);
  const $count = screen.queryByTestId('count')!;
  const $loading = screen.queryByTestId('loading')!;

  expect($count.innerHTML).toBe('0');
  expect($loading.innerHTML).toBe('false');

  act(() => {
    basicModel.plus(0);
  });
  expect($count.innerHTML).toBe('0');

  act(() => {
    basicModel.plus(1);
  });
  expect($count.innerHTML).toBe('1');

  act(() => {
    basicModel.plus(20.5);
  });
  expect($count.innerHTML).toBe('21.5');

  act(() => {
    complexModel.addUser(40, '');
  });
  expect($count.innerHTML).toBe('22.5');

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync();
  });
  expect($loading.innerHTML).toBe('true');

  await act(async () => {
    await promise;
  });
  expect($loading.innerHTML).toBe('false');
});
