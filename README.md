# FOCA

流畅的 react 状态管理库，基于[redux](https://github.com/reduxjs/redux)和[react-redux](https://github.com/reduxjs/react-redux)。简洁、极致、高效。

[![License](https://img.shields.io/github/license/foca-js/foca)](https://github.com/foca-js/foca/blob/master/LICENSE)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/foca-js/foca/Test/master?label=test)](https://github.com/foca-js/foca/actions)
[![Codecov](https://img.shields.io/codecov/c/github/foca-js/foca)](https://codecov.io/gh/foca-js/foca)
[![npm](https://img.shields.io/npm/v/foca)](https://www.npmjs.com/package/foca)
[![npm bundle size (version)](https://img.shields.io/bundlephobia/minzip/foca?label=bundle+size)](https://bundlephobia.com/package/foca@latest)
[![npm peer dependency version](https://img.shields.io/npm/dependency-version/foca/peer/react)](https://github.com/facebook/react)

# 特性

- 模块化开发
- 专注 typescript 极致体验
- 支持 Map/Set 数据类型
- 内置 immer 快速处理状态
- 异步方法自动追踪状态
- 可定制的多引擎数据持久化
- 数据隔离，允许同类状态库并存
- 模型自动注册，拒绝繁琐

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
  },
  effects: {
    // 异步函数，自动追踪执行状态(meta, loading)
    async doSomething() {
      await Promise.resolve();
      // 直接处理状态，对于网络请求的数据十分方便
      this.dispatch({ count: 1 });
      this.dispatch((state) => {
        state.count += 1;
      });
      // 调用action函数处理状态
      this.plus(1, true);

      // 调用effect函数
      return this.commonUtil(1);
    },
    // 同步函数
    commonUtil(x: number) {
      return x + 1;
    },
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
};

const mapStateToProps = () => {
  return {
    count: counterModel.state.count,
    loading: getLoading(counterModel.doSomething);
  };
}

export default connect(mapStateToProps)(App);
```

# 文档

https://foca-js.github.io/foca/

# 例子

在线试玩：https://codesandbox.io/s/foca-demos-e8rh3
<br />
本地体验：https://github.com/foca-js/foca-demos

# 推荐搭配

| 仓库                                                                        | 版本                                                                                                                | 描述                      | 平台                                  |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------- | ------------------------------------- |
| [axios](https://github.com/axios/axios)                                     | [![npm](https://img.shields.io/npm/v/axios)](https://www.npmjs.com/package/axios)                                   | 当下最流行的请求库        | React, RN                             |
| [foca-axios](https://github.com/foca-js/foca-axios)                         | [![npm](https://img.shields.io/npm/v/foca-axios)](https://www.npmjs.com/package/foca-axios)                         | 针对 axios 的增强型适配器 | React, RN                             |
| [foca-miniprogram-axios](https://github.com/foca-js/foca-miniprogram-axios) | [![npm](https://img.shields.io/npm/v/foca-miniprogram-axios)](https://www.npmjs.com/package/foca-miniprogram-axios) | 针对 axios 的增强型适配器 | 原生小程序<br> Taro, Remax 等跨端平台 |
| [foca-taro-storage](https://github.com/foca-js/foca-taro-storage)           | [![npm](https://img.shields.io/npm/v/foca-taro-storage)](https://www.npmjs.com/package/foca-taro-storage)           | Taro 持久化引擎           | Taro                                  |
