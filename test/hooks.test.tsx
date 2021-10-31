import React, { FC } from 'react';
import { act, create } from 'react-test-renderer';
import { FocaProvider, store, useLoading, useMeta, useModel } from '../src';
import App from './components/App';
import { basicModel } from './models/basic-model';
import { complexModel } from './models/complex-model';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

const Root: FC = ({ children }) => {
  return (
    <FocaProvider>
      <App />
      {children}
    </FocaProvider>
  );
};

test('component useModel', async () => {
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

test('component useLoading', async () => {
  const dom = create(<Root />);
  const loading1 = dom.root.findByProps({ id: 'loading1' });
  const loading2 = dom.root.findByProps({ id: 'loading2' });

  expect(loading1.children[0]).toBe('false');
  expect(loading2.children[0]).toBe('false');

  let promise!: Promise<any>;

  act(() => {
    promise = basicModel.pureAsync();
    dom.update(<Root />);
  });

  expect(loading1.children[0]).toBe('true');
  expect(loading2.children[0]).toBe('true');

  await act(async () => {
    await promise;
    dom.update(<Root />);
  });

  expect(loading1.children[0]).toBe('false');
  expect(loading2.children[0]).toBe('false');

  dom.unmount();
});

test('component useMeta', async () => {
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

  dom.unmount();
});

test.skip('hook useMeta', () => {
  const basic = useModel(basicModel);
  basic.count.toFixed();
  basic.hello.trim();
  // @ts-expect-error
  basic.notExist;

  const count = useModel(basicModel, (state) => state.count);
  count.toFixed();
  // @ts-expect-error
  count.trim();

  const obj = useModel(basicModel, complexModel);
  obj.basic.count.toFixed();
  obj.complex.ids.entries();
  // @ts-expect-error
  obj.notExists;

  const hello = useModel(
    basicModel,
    complexModel,
    (basic, complex) => basic.hello + complex.ids.size,
  );

  hello.trim();
  // @ts-expect-error
  hello.toFixed();
});

test.skip('hook useLoading', () => {
  useLoading(basicModel.bar).valueOf();
  useLoading(basicModel.foo, basicModel.bar).valueOf();
  // @ts-expect-error
  useLoading(basicModel.minus);
  // @ts-expect-error
  useLoading(basicModel);
  // @ts-expect-error
  useLoading({});
});

test.skip('hook useMeta', () => {
  const meta = useMeta(basicModel.bar);
  meta.message?.trim();
  meta.loading?.valueOf();
  // @ts-expect-error
  meta.message?.toFixed();

  // @ts-expect-error
  useMeta(basicModel.plus);
});
