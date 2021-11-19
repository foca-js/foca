import React from 'react';
import { FC } from 'react';
import { act, create } from 'react-test-renderer';
import { store, connect, FocaProvider } from '../src';
import { basicModel } from './models/basic-model';
import { complexModel } from './models/complex-model';

let App: FC<ReturnType<typeof mapStateToProps>> = ({ countFromConnect }) => {
  return <div id="countFromConnect">{countFromConnect}</div>;
};

const mapStateToProps = () => {
  return {
    countFromConnect: basicModel.state.count + complexModel.state.ids.size,
  };
};

const Connect = connect(mapStateToProps)(App);

const Root: FC = () => {
  return (
    <FocaProvider>
      <Connect />
    </FocaProvider>
  );
};

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('Get state from connect', () => {
  const dom = create(<Root />);
  const data = dom.root.findByProps({ id: 'countFromConnect' });

  expect(data.children[0]).toBe('0');

  act(() => {
    basicModel.plus(1);
  });
  expect(data.children[0]).toBe('1');

  act(() => {
    basicModel.plus(20.5);
  });
  expect(data.children[0]).toBe('21.5');

  act(() => {
    complexModel.addUser(40, '');
  });
  expect(data.children[0]).toBe('22.5');

  dom.unmount();
});
