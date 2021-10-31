import React from 'react';
import { FC } from 'react';
import { act, create } from 'react-test-renderer';
import { store, FocaProvider } from '../src';
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
