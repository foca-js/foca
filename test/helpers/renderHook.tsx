import { render } from '@testing-library/react';
import React, { ComponentType, createRef, FC, useEffect } from 'react';
import { FocaProvider } from '../../src';

interface RenderHookResult<Result, Props> {
  rerender: (props?: Props) => void;
  result: { current: Result };
  unmount: () => void;
}

interface RenderHookOptions<Props> {
  initialProps?: Props;
  wrapper?: ComponentType;
}

export function renderHook<Result, Props>(
  renderCallback: (initialProps?: Props) => Result,
  options: RenderHookOptions<Props> = {},
): RenderHookResult<Result, Props> {
  const { initialProps, wrapper = FocaProvider } = options;

  const result = createRef<Result>();

  const TestComponent: FC<{ renderCallbackProps?: Props }> = (props) => {
    const pendingResult = renderCallback(props.renderCallbackProps);

    useEffect(() => {
      // @ts-expect-error
      result.current = pendingResult;
    });

    return null;
  };

  const { rerender: baseRerender, unmount } = render(
    <TestComponent renderCallbackProps={initialProps} />,
    { wrapper },
  );

  function rerender(rerenderCallbackProps?: Props) {
    return baseRerender(
      <TestComponent renderCallbackProps={rerenderCallbackProps} />,
    );
  }

  return {
    // @ts-expect-error
    result,
    rerender,
    unmount,
  };
}
