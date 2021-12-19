import React, { FC } from 'react';
import { act, create } from 'react-test-renderer';
import { engines, FocaProvider, store } from '../src';
import { PersistGateProps } from '../src/persist/PersistGate';
import { basicModel } from './models/basicModel';

const Loading: FC = () => <div id="gateLoading">Yes</div>;

const Root: FC<PersistGateProps & { useFunction?: boolean }> = ({
  loading,
  useFunction,
}) => {
  return (
    <FocaProvider loading={loading}>
      {useFunction ? (
        (isReady: boolean) => (
          <>
            <div id="isReady">{String(isReady)}</div>
            <div id="inner" />
          </>
        )
      ) : (
        <div id="inner" />
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
        engine: engines.localStorage,
      },
    ],
  });
});

afterEach(() => {
  store.unmount();
});

test('PersistGate will inject to shadow dom', async () => {
  const dom = create(<Root />);
  expect(() => dom.root.findByProps({ id: 'inner' })).toThrowError(
    'No instances found',
  );

  await act(async () => {
    await store.onInitialized();
    dom.update(<Root />);
  });
  expect(dom.root.findByProps({ id: 'inner' })).toBeInstanceOf(Object);

  dom.unmount();
});

test('PersistGate allows function children', async () => {
  const dom = create(<Root useFunction />);
  expect(dom.root.findByProps({ id: 'isReady' }).children[0]).toBe('false');

  await act(async () => {
    await store.onInitialized();
    dom.update(<Root useFunction />);
  });
  expect(dom.root.findByProps({ id: 'isReady' }).children[0]).toBe('true');

  dom.unmount();
});

test('PersistGate allows loading children', async () => {
  const dom = create(<Root loading={<Loading />} />);
  expect(() => dom.root.findByProps({ id: 'inner' })).toThrowError(
    'No instances found',
  );
  expect(dom.root.findByProps({ id: 'gateLoading' }).children[0]).toBe('Yes');

  await act(async () => {
    await store.onInitialized();
    dom.update(<Root loading={<Loading />} />);
  });

  expect(dom.root.findByProps({ id: 'inner' })).toBeInstanceOf(Object);
  expect(() => dom.root.findByProps({ id: 'gateLoading' })).toThrowError(
    'No instances found',
  );

  dom.unmount();
});

test('PersistGate will warning for both function children and loading children', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation();
  const dom = create(<Root useFunction loading={<Loading />} />);
  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockRestore();

  dom.unmount();
});
