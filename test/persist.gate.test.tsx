import React, { FC } from 'react';
import { act, render, screen } from '@testing-library/react';
import { FocaProvider, store } from '../src';
import { PersistGateProps } from '../src/persist/PersistGate';
import { basicModel } from './models/basicModel';
import { slowEngine } from './helpers/slowEngine';

const Loading: FC = () => <div data-testid="gateLoading">Yes</div>;

const Root: FC<PersistGateProps & { useFunction?: boolean }> = ({
  loading,
  useFunction,
}) => {
  return (
    <FocaProvider loading={loading}>
      {useFunction ? (
        (isReady: boolean) => (
          <>
            <div data-testid="isReady">{String(isReady)}</div>
            <div data-testid="inner" />
          </>
        )
      ) : (
        <div data-testid="inner" />
      )}
    </FocaProvider>
  );
};

beforeEach(() => {
  store.init({
    persist: [
      {
        version: 1,
        key: 'test1',
        models: [basicModel],
        engine: slowEngine,
      },
    ],
  });
});

afterEach(() => {
  store.unmount();
});

test('PersistGate will inject to shadow dom', async () => {
  render(<Root />);
  expect(screen.queryByTestId('inner')).toBeNull();

  await act(async () => {
    await store.onInitialized();
  });
  expect(screen.queryByTestId('inner')).not.toBeNull();
});

test('PersistGate allows function children', async () => {
  render(<Root useFunction />);
  expect(screen.queryByTestId('isReady')!.innerHTML).toBe('false');

  await act(async () => {
    await store.onInitialized();
  });
  expect(screen.queryByTestId('isReady')!.innerHTML).toBe('true');
});

test('PersistGate allows loading children', async () => {
  render(<Root loading={<Loading />} />);
  expect(screen.queryByTestId('inner')).toBeNull();
  expect(screen.queryByTestId('gateLoading')!.innerHTML).toBe('Yes');

  await act(async () => {
    await store.onInitialized();
  });

  expect(screen.queryByTestId('inner')).not.toBeNull();
  expect(screen.queryByTestId('gateLoading')).toBeNull();
});

test('PersistGate will warning for both function children and loading children', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation();

  render(<Root useFunction loading={<Loading />} />);
  expect(spy).toHaveBeenCalledTimes(1);

  await act(() => store.onInitialized());
  expect(spy).toHaveBeenCalledTimes(2);

  spy.mockRestore();
});
