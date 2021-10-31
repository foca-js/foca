import React, { FC } from 'react';
import { act, create } from 'react-test-renderer';
import { engines, FocaProvider, store } from '../src';
import { PersistGateProps } from '../src/persist/PersistGate';
import App from './components/App';
import { basicModel } from './models/basic-model';
import { storeReady } from './utils/storeReady';

const Loading: FC = () => <div id="gateLoading">Yes</div>;

const Root: FC<PersistGateProps> = ({ loading }) => {
  return (
    <FocaProvider loading={loading}>
      <App />
    </FocaProvider>
  );
};

const RootWithFunctionChildren: FC<PersistGateProps> = ({ loading }) => {
  return (
    <FocaProvider loading={loading}>
      {(isReady: boolean) => (
        <>
          <div id="isReady">{String(isReady)}</div>
          <App />
        </>
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
  expect(() => dom.root.findByProps({ id: 'count1' })).toThrowError('No instances found');

  await act(async () => {
    await storeReady();
    dom.update(<Root />);
  });
  expect(dom.root.findByProps({ id: 'count1' })).toBeInstanceOf(Object);

  dom.unmount();
});

test('PersistGate allows function children', async () => {
  const dom = create(<RootWithFunctionChildren />);
  expect(dom.root.findByProps({ id: 'isReady' }).children[0]).toBe('false');

  await act(async () => {
    await storeReady();
    dom.update(<RootWithFunctionChildren />);
  });
  expect(dom.root.findByProps({ id: 'isReady' }).children[0]).toBe('true');

  dom.unmount();
});

test('PersistGate allows loading children', async () => {
  const dom = create(<Root loading={<Loading />} />);
  expect(() => dom.root.findByProps({ id: 'count1' })).toThrowError('No instances found');
  expect(dom.root.findByProps({ id: 'gateLoading' }).children[0]).toBe('Yes');

  await act(async () => {
    await storeReady();
    dom.update(<Root loading={<Loading />} />);
  });

  expect(dom.root.findByProps({ id: 'count1' })).toBeInstanceOf(Object);
  expect(() => dom.root.findByProps({ id: 'gateLoading' })).toThrowError('No instances found');

  dom.unmount();
});

test('PersistGate will warning for both function children and loading children', async () => {
  const spy = jest.spyOn(console, 'error').mockImplementation();
  const dom = create(<RootWithFunctionChildren loading={<Loading />} />);
  expect(spy).toHaveBeenCalledTimes(1);
  spy.mockRestore();

  dom.unmount();
});
