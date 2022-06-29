import { AnyAction, Middleware } from 'redux';

export const createActionInActionInterceptor = (): Middleware => {
  let dispatching = false;
  let prevAction: AnyAction | null = null;

  return () => (dispatch) => (action: AnyAction) => {
    if (dispatching) {
      throw new Error(
        '[dispatch] 派发任务冲突，请检查是否在actions函数中直接或者间接执行了其他actions或者effects函数。\nactions的唯一职责是更新当前的state，有额外的业务逻辑时请把effects作为执行入口并按需调用actions。\n\n当前冲突的action：\n\n' +
          JSON.stringify(action, null, 4) +
          '\n\n上次执行未完成的action：\n\n' +
          JSON.stringify(prevAction, null, 4) +
          '\n\n',
      );
    }

    // 如果触发了action in action操作，抛出异常，则上层action无法继续设置dispatching=false
    try {
      dispatching = true;
      prevAction = action;
      return dispatch(action);
    } finally {
      prevAction = null;
      dispatching = false;
    }
  };
};
