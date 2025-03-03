import { act, render } from '@testing-library/react';
import { FC, useEffect, version } from 'react';
import sleep from 'sleep-promise';
import { defineModel, FocaProvider, store, useModel } from '../src';

const model = defineModel('aia' + Math.random(), {
  initialState: {
    open: false,
    count: 1,
  },
  reducers: {
    plus(state) {
      state.count += 1;
    },
    toggle(state) {
      state.open = !state.open;
    },
  },
});

const OtherComponent: FC = () => {
  useEffect(() => {
    model.plus();
  }, []);
  return null;
};

const App: FC = () => {
  const { open } = useModel(model);
  return <>{open && <OtherComponent />}</>;
};

test.runIf(version.split('.')[0] === '18').each([true, false])(
  `[legacy: %s] forceUpdate should not cause action in action error`,
  async (legacy) => {
    store.init();

    render(
      <FocaProvider>
        <App />
      </FocaProvider>,
      {
        legacyRoot: legacy,
      },
    );

    // console.error
    // Warning: You seem to have overlapping act() calls, this is not supported. Be sure to await previous act() calls before making a new one.
    const spy = vitest.spyOn(console, 'error').mockImplementation(() => {});

    await expect(
      Promise.all(
        Array(3)
          .fill('')
          .map((_, i) =>
            act(async () => {
              await sleep(i * 2);
              model.toggle();
            }),
          ),
      ),
    ).resolves.toStrictEqual(Array(3).fill(void 0));

    // 等待useEffect
    await sleep(1000);
    store.unmount();
    spy.mockRestore();
  },
);
