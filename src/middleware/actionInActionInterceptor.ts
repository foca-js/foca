import type { AnyAction, Middleware } from 'redux';
import { isPreModelAction } from '../actions/model';

// 开发者有可能在action中执行action，这是十分不规范的操作。
export const actionInActionInterceptor: Middleware = () => {
  let dispatching = false;
  let prevAction: AnyAction | null = null;

  return (dispatch) => (action: AnyAction) => {
    if (!isPreModelAction(action)) {
      // 非model的action会直接进入redux，redux中已经有dispatch保护机制。
      return dispatch(action);
    }

    // model的action如果没有变化则不会进入redux，所以需要在这里额外保护。
    if (dispatching) {
      throw new Error(
        '[dispatch] 派发任务冲突，请检查是否在reducers函数中直接或者间接执行了其他reducers或者methods函数。\nreducers的唯一职责是更新当前的state，有额外的业务逻辑时请把methods作为执行入口并按需调用reducers。\n\n当前冲突的reducer：\n\n' +
          JSON.stringify(action, null, 4) +
          '\n\n上次执行未完成的reducer：\n\n' +
          JSON.stringify(prevAction, null, 4) +
          '\n\n',
      );
    }

    try {
      dispatching = true;
      prevAction = action;
      /**
       * react-redux@8 主要服务于react18
       * 在react17中有可能出现redux遍历subscriber时立即触发dispatch，然后这边来不及设置dispatching=false
       * @link https://github.com/foca-js/foca/issues/20
       */
      action.actionInActionGuard = () => {
        dispatching = false;
        prevAction = null;
      };
      return dispatch(action);
    } catch (e) {
      prevAction = null;
      dispatching = false;
      throw e;
    }
  };
};
