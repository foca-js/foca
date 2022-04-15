import { act, render, screen } from '@testing-library/react';
import { FocaProvider, store, useModel } from '../src';
import { basicModel } from './models/basicModel';
import React, { FC, useEffect, useState } from 'react';

const IS_REACT_18 = React.version.startsWith('18');
const IS_REACT_REDUX_7 = process.env['REACT_REDUX_VERSION'] === '7.x';

if (IS_REACT_18) {
  beforeEach(() => {
    store.init();
  });

  afterEach(() => {
    store.unmount();
  });

  test('Support concurrent rendering for react 18', async () => {
    const arr = Array(40000).fill('');
    let counter = 0;

    const ConcurrentComp: FC = () => {
      const [_, setTmp] = useState(0);
      const value = useModel(basicModel, (state) => state.count);
      // @ts-ignore
      const defferedValue = React.useDeferredValue(value);

      useEffect(() => {
        setTmp(0);
      }, []);

      useEffect(() => {
        if (counter++ < 2) {
          // @ts-ignore
          React.startTransition(() => {
            basicModel.plus(1);
          });
        }
      });

      return (
        <>
          <span data-testid="defferedValue">{defferedValue}</span>
          {arr.map((_, i) => (
            <span key={i}>{value}</span>
          ))}
          <span data-testid="normalValue">{value}</span>
        </>
      );
    };

    render(
      <FocaProvider>
        <ConcurrentComp />
      </FocaProvider>,
    );

    await act(async () => store.onInitialized());

    // react-redux v7 doesn't support concurrent mode.
    expect(screen.queryByTestId('defferedValue')!.innerHTML).toBe(
      IS_REACT_REDUX_7 ? '1' : '2',
    );
    expect(screen.queryByTestId('normalValue')!.innerHTML).toBe('2');
  }, 10000);
} else {
  test('no concurrent when react < 18', () => {});
}
