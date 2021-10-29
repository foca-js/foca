import { FC } from 'hoist-non-react-statics/node_modules/@types/react';
import React from 'react';
import { act, create } from 'react-test-renderer';
import sleep from 'sleep-promise';
import { ReduxProvider, store } from '../src';
import { AppFC } from './mock/AppFC';
import { basicModel } from './mock/basic-model';
import { complexModel } from './mock/complex-model';

beforeEach(() => {
  store.init({});
});

afterEach(() => {
  store.refresh(true);
});

const Root: FC = () => {
  return (
    <ReduxProvider>
      <AppFC />
    </ReduxProvider>
  );
};

test('useModel', async () => {
  const dom = create(<Root />);

  const count1 = dom.root.findByProps({ id: 'count1' });
  const count2 = dom.root.findByProps({ id: 'count2' });
  const state1 = dom.root.findByProps({ id: 'state1' });
  const state2 = dom.root.findByProps({ id: 'state2' });

  expect(count1.children[0]).toBe('0');
  expect(count2.children[0]).toBe('0');
  expect(state1.children[0]).toBe(basicModel.name + ',' + complexModel.name);
  expect(state2.children[0]).toBe('0');

  act(() => {
    basicModel.plus(56);
    complexModel.addUser(5, 'lucifer');
  });

  expect(count1.children[0]).toBe('56');
  expect(count2.children[0]).toBe('56');
  expect(state1.children[0]).toBe(basicModel.name + ',' + complexModel.name);
  expect(state2.children[0]).toBe('57');

  dom.unmount();
});

test('useLoading', async () => {
  const dom = create(<Root />);
  const loading1 = dom.root.findByProps({ id: 'loading1' });
  const loading2 = dom.root.findByProps({ id: 'loading2' });

  expect(loading1.children[0]).toBe('false');
  expect(loading2.children[0]).toBe('false');

  await act(async () => {
    const promise = basicModel.pureAsync();

    await sleep(1);
    dom.update(<Root />);
    expect(loading1.children[0]).toBe('true');
    expect(loading2.children[0]).toBe('true');

    await promise;
    dom.update(<Root />);
  });

  expect(loading1.children[0]).toBe('false');
  expect(loading2.children[0]).toBe('false');
});

test('useMeta', async () => {
  const dom = create(<Root />);
  const message = dom.root.findByProps({ id: 'message' });

  expect(message.children[0]).toBe('--');

  await act(async () => {
    try {
      await basicModel.hasError();
    } catch {}
    dom.update(<Root />);
  });

  expect(message.children[0]).toBe('my-test');
});
