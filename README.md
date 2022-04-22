# FOCA

流畅的 react 状态管理库，基于[redux](https://github.com/reduxjs/redux)和[react-redux](https://github.com/reduxjs/react-redux)。简洁、极致、高效。

[![License](https://img.shields.io/github/license/foca-js/foca)](https://github.com/foca-js/foca/blob/master/LICENSE)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/foca-js/foca/Test/master?label=test)](https://github.com/foca-js/foca/actions)
[![Codecov](https://img.shields.io/codecov/c/github/foca-js/foca)](https://codecov.io/gh/foca-js/foca)
[![npm](https://img.shields.io/npm/v/foca)](https://www.npmjs.com/package/foca)
[![npm bundle size (version)](https://img.shields.io/bundlephobia/minzip/foca?label=bundle+size)](https://bundlephobia.com/package/foca@latest)
![GitHub top language](https://img.shields.io/github/languages/top/foca-js/foca)
[![npm peer dependency version](https://img.shields.io/npm/dependency-version/foca/peer/react)](https://github.com/facebook/react)

<br>

![mind map](https://raw.githubusercontent.com/foca-js/foca/master/docs/mindMap.svg)

# 特性

- 模块化开发
- 专注 typescript 极致体验
- 模型自动注册，导出即可使用
- 内置 immer 快速处理数据
- 智能追踪异步函数的执行状态
- 模型支持私有方法
- 可定制的多引擎数据持久化
- 数据隔离，允许同类状态库并存

# 安装

```bash
yarn add foca
```

# 使用

### 定义模型

```typescript
// File: counterModel.ts
import { defineModel } from 'foca';

const initialState: { count: number } = {
  count: 0,
};

// 无须手动注册到store，直接导出到react组件中使用
export const counterModel = defineModel('counter', {
  // 初始值，必填属性，其他属性均可选
  initialState,
  actions: {
    // state可自动提示类型 { count: number }
    plus(state, value: number, double: boolean = false) {
      // 直接修改状态
      state.count += value * (double ? 2 : 1);
    },
    minus(state, value: number) {
      // 直接返回新状态
      return { count: state.count - value };
    },
    // 私有方法，只能在模型内部被effect方法调用，外部调用则TS报错（属性不存在）
    _clear(state) {
      return this.initialState;
    },
  },
  effects: {
    // 异步函数，自动追踪执行状态(loading)
    async doSomething() {
      // 调用私有方法
      await this._sleep(100);

      // 快速处理状态，对于网络请求的数据十分方便
      this.setState({ count: 1 });
      this.setState((state) => {
        state.count += 1;
      });
      // 调用action函数处理状态
      this.plus(1, true);

      // 调用effect函数
      return this.commonUtil(1);
    },
    // 普通函数
    commonUtil(x: number) {
      return x + 1;
    },
    // 私有方法，只能在模型内部使用，外部调用则TS报错（属性不存在）
    _sleep(duration: number) {
      return new Promise((resolve) => {
        setTimeout(resolve, duration);
      });
    },
  },
  hooks: {
    // store初始化完成后触发onInit钩子
    onInit() {
      this.plus(1);
      console.log(this.state);
    },
    // state变化时的回调
    onChange(prevState, nextState) {},
  },
});
```

### 在函数组件中使用

```tsx
import { FC, useEffect } from 'react';
import { useModel, useLoading } from 'foca';
import { counterModel } from './counterModel';

const App: FC = () => {
  // count类型自动提示 number
  const { count } = useModel(counterModel);
  // 仅effects的异步函数能作为参数传入，其他函数TS自动报错
  const loading = useLoading(counterModel.doSomething);

  useEffect(() => {
    counterModel.doSomething();
  }, []);

  return (
    <div onClick={() => counterModel.plus(1)}>
      {count} {loading ? 'Loading...' : null}
    </div>
  );
};

export default App;
```

### 在类组件中使用

```tsx
import { Component } from 'react';
import { connect, getLoading } from 'foca';
import { counterModel } from './counterModel';

type Props = ReturnType<typeof mapStateToProps>;

class App extends Component<Props> {
  componentDidMount() {
    counterModel.doSomething();
  }

  render() {
    const { count, loading } = this.props;

    return (
      <div onClick={() => counterModel.plus(1)}>
        {count} {loading ? 'Loading...' : null}
      </div>
    );
  }
}

const mapStateToProps = () => {
  return {
    count: counterModel.state.count,
    loading: getLoading(counterModel.doSomething),
  };
};

export default connect(mapStateToProps)(App);
```

# 文档

https://foca.js.org

# 例子

沙盒在线试玩：https://codesandbox.io/s/foca-demos-e8rh3
<br />
React 案例仓库：https://github.com/foca-js/foca-demo-web
<br>
RN 案例仓库：https://github.com/foca-js/foca-demo-react-native
<br>
Taro 案例仓库：https://github.com/foca-js/foca-demo-taro

# 生态

| 仓库                                                                            | 版本                                                                                                                                                      | 描述                      | 平台                       |
| ------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------- | -------------------------- |
| [axios](https://github.com/axios/axios)                                         | [![npm](https://img.shields.io/npm/v/axios)](https://www.npmjs.com/package/axios)                                                                         | 当下最流行的请求库        | React, RN                  |
| [foca-axios](https://github.com/foca-js/foca-axios)                             | [![npm](https://img.shields.io/npm/v/foca-axios)](https://www.npmjs.com/package/foca-axios)                                                               | 针对 axios 的增强型适配器 | React, RN                  |
| [foca-miniprogram-axios](https://github.com/foca-js/foca-miniprogram-axios)     | [![npm](https://img.shields.io/npm/v/foca-miniprogram-axios)](https://www.npmjs.com/package/foca-miniprogram-axios)                                       | 针对 axios 的增强型适配器 | Taro, Remax                |
| [foca-taro-storage](https://github.com/foca-js/foca-taro-storage)               | [![npm](https://img.shields.io/npm/v/foca-taro-storage)](https://www.npmjs.com/package/foca-taro-storage)                                                 | Taro 持久化引擎           | Taro                       |
| [rn-async-storage](https://github.com/react-native-async-storage/async-storage) | [![npm](https://img.shields.io/npm/v/@react-native-async-storage/async-storage)](https://www.npmjs.com/package/@react-native-async-storage/async-storage) | React-Native 持久化引擎   | RN                         |
| [localForage](https://github.com/localForage/localForage)                       | [![npm](https://img.shields.io/npm/v/localforage)](https://www.npmjs.com/package/localforage)                                                             | 浏览器端持久化引擎        | React                      |
| [redux-logger](https://github.com/LogRocket/redux-logger)                       | [![npm](https://img.shields.io/npm/v/redux-logger)](https://www.npmjs.com/package/redux-logger)                                                           | 控制台打印 redux 日志     | React, RN <br> Taro, Remax |
