import { act, render } from '@testing-library/react';
import React, { FC, useEffect } from 'react';
import sleep from 'sleep-promise';
import { defineModel, FocaProvider, store, useModel } from '../src';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

const model = defineModel('aia' + Math.random(), {
  initialState: {
    open: false,
    count: 1,
  },
  actions: {
    plus(state) {
      state.count += 1;
    },
    open(state) {
      state.open = !state.open;
    },
  },
});

const OtherComponent: FC = () => {
  useEffect(() => {
    model.plus();
  }, [model]);

  return null;
};

const App: FC = () => {
  const { open } = useModel(model);

  return <>{open && <OtherComponent />}</>;
};

test('useEffect and model.state changed with react@17', async () => {
  render(
    <FocaProvider>
      <App />
    </FocaProvider>,
  );

  const spy = jest.spyOn(console, 'error').mockImplementation(() => {});

  await expect(
    Promise.all(
      Array(3)
        .fill('')
        .map((_, i) =>
          act(async () => {
            await sleep(i * 2);
            model.open();
          }),
        ),
    ),
  ).resolves.toStrictEqual(Array(3).fill(void 0));

  spy.mockRestore();
});
