import { render, screen } from '@testing-library/react';
import { FocaProvider, store } from '../src';

beforeEach(() => {
  store.init();
});

afterEach(() => {
  store.unmount();
});

test('render normal tag', () => {
  render(
    <FocaProvider>
      <div data-testid="root">Hello World</div>
    </FocaProvider>,
  );

  expect(screen.queryByTestId('root')!.innerHTML).toBe('Hello World');
});

test('render function tag', () => {
  render(
    <FocaProvider>
      {() => <div data-testid="root">Hello World</div>}
    </FocaProvider>,
  );

  expect(screen.queryByTestId('root')!.innerHTML).toBe('Hello World');
});
