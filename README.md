# FOCA

流畅的 react 状态管理库，基于[redux](https://github.com/reduxjs/redux)和[react-redux](https://github.com/reduxjs/react-redux)。简洁、极致、高效。

[![npm peer react version](https://img.shields.io/npm/dependency-version/foca/peer/react?logo=react)](https://github.com/facebook/react)
[![npm peer typescript version](https://img.shields.io/npm/dependency-version/foca/peer/typescript?logo=typescript)](https://github.com/microsoft/TypeScript)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/actions/workflow/status/foca-js/foca/test.yml?branch=master&label=test&logo=vitest)](https://github.com/foca-js/foca/actions)
[![Codecov](https://img.shields.io/codecov/c/github/foca-js/foca?logo=codecov)](https://codecov.io/gh/foca-js/foca)
[![npm](https://img.shields.io/npm/v/foca?logo=npm)](https://www.npmjs.com/package/foca)
[![npm](https://img.shields.io/npm/dt/foca?logo=codeforces)](https://www.npmjs.com/package/foca)
[![npm bundle size (version)](https://img.shields.io/bundlephobia/minzip/foca?label=bundle+size&cacheSeconds=3600&logo=esbuild)](https://bundlephobia.com/package/foca@latest)
[![License](https://img.shields.io/github/license/foca-js/foca?logo=open-source-initiative)](https://github.com/foca-js/foca/blob/master/LICENSE)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?logo=prettier)](https://github.com/prettier/prettier)

<br>

![mind map](https://raw.githubusercontent.com/foca-js/foca/master/docs/mindMap.svg)

# 特性

- 模块化开发，导出即可使用
- 专注 TS 极致体验，100%类型提示
- 内置 [immer](https://github.com/immerjs/immer) 响应式修改数据
- 支持 computed 计算属性，自动收集依赖，可传参数
- 支持私有方法
- 自动管理异步函数的 loading 状态
- 可定制的多引擎数据持久化

# 缺陷

- [不支持 SSR](https://foca.js.org/#/troubleshooting?id=为什么不支持-ssr)

# 使用环境

- 现代化浏览器
- React Native
- Taro
- Electron
- ios 8+

# 安装

```bash
# npm
npm install foca
# yarn
yarn add foca
# pnpm
pnpm add foca
```

# 初始化

```typescript
import { store } from 'foca';

store.init();
```

# 创建模型

### reducers 修改数据

```typescript
import { defineModel } from 'foca';

const initialState: { count: number } = { count: 0 };

export const counterModel = defineModel('counter', {
  initialState,
  reducers: {
    // 支持无限参数
    plus(state, value: number, times: number = 1) {
      state.count += value * times;
    },
    minus(state, value: number) {
      return { count: state.count - value };
    },
  },
});
```

### computed 计算属性

```typescript
export const counterModel = defineModel('counter', {
  initialState,
  // 自动收集依赖
  computed: {
    filled() {
      return Array(this.state.count)
        .fill('')
        .map((_, index) => index)
        .map((item) => item * 2);
    },
  },
});
```

### methods 组合逻辑

```typescript
export const counterModel = defineModel('counter', {
  initialState,
  reducers: {
    increment(state) {
      state.count += 1;
    },
  },
  methods: {
    async incrementAsync() {
      await this._sleep(100);

      this.increment();
      // 也可直接修改状态而不通过reducers，仅在内部使用
      this.setState({ count: this.state.count + 1 });
      this.setState((state) => {
        state.count += 1;
      });

      return 'OK';
    },
    // 私有方法，外部使用时不会提示该方法
    _sleep(duration: number) {
      return new Promise((resolve) => {
        setTimeout(resolve, duration);
      });
    },
  },
});
```

### events 事件回调

```typescript
export const counterModel = defineModel('counter', {
  initialState,
  events: {
    // 模型初始化
    onInit() {
      console.log(this.state);
    },
    // 模型数据变更
    onChange(prevState, nextState) {},
  },
});
```

# 使用

### 在 function 组件中使用

```tsx
import { FC, useEffect } from 'react';
import { useModel, useLoading } from 'foca';
import { counterModel } from './counterModel';

const App: FC = () => {
  const count = useModel(counterModel, (state) => state.count);
  const loading = useLoading(counterModel.incrementAsync);

  useEffect(() => {
    counterModel.incrementAsync();
  }, []);

  return (
    <div onClick={() => counterModel.plus(1)}>
      {count} {loading ? 'Loading...' : null}
    </div>
  );
};

export default App;
```

### 在 class 组件中使用

```tsx
import { Component } from 'react';
import { connect, getLoading } from 'foca';
import { counterModel } from './counterModel';

type Props = ReturnType<typeof mapStateToProps>;

class App extends Component<Props> {
  componentDidMount() {
    counterModel.incrementAsync();
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
    loading: getLoading(counterModel.incrementAsync),
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

#### 网络请求

| 仓库                                                | 版本                                                                                        | 描述                           |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------- | ------------------------------ |
| [axios](https://github.com/axios/axios)             | [![npm](https://img.shields.io/npm/v/axios)](https://www.npmjs.com/package/axios)           | 当下最流行的请求库             |
| [foca-axios](https://github.com/foca-js/foca-axios) | [![npm](https://img.shields.io/npm/v/foca-axios)](https://www.npmjs.com/package/foca-axios) | axios 适配器，节流、缓存、重试 |

#### 持久化存储引擎

| 仓库                                                                                      | 版本                                                                                                                                                      | 描述                                       | 平台     |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------ | -------- |
| [react-native-async-storage](https://github.com/react-native-async-storage/async-storage) | [![npm](https://img.shields.io/npm/v/@react-native-async-storage/async-storage)](https://www.npmjs.com/package/@react-native-async-storage/async-storage) | React-Native 持久化引擎                    | RN       |
| [foca-taro-storage](https://github.com/foca-js/foca-taro-storage)                         | [![npm](https://img.shields.io/npm/v/foca-taro-storage)](https://www.npmjs.com/package/foca-taro-storage)                                                 | Taro 持久化引擎                            | Taro     |
| [localforage](https://github.com/localForage/localForage)                                 | [![npm](https://img.shields.io/npm/v/localforage)](https://www.npmjs.com/package/localforage)                                                             | 浏览器端持久化引擎，支持 IndexedDB, WebSQL | Web      |
| [foca-electron-storage](https://github.com/foca-js/foca-electron-storage)                 | [![npm](https://img.shields.io/npm/v/foca-electron-storage)](https://www.npmjs.com/package/foca-electron-storage)                                         | Electron 持久化引擎                        | Electron |
| [foca-cookie-storage](https://github.com/foca-js/foca-cookie-storage)                     | [![npm](https://img.shields.io/npm/v/foca-cookie-storage)](https://www.npmjs.com/package/foca-cookie-storage)                                             | Cookie 持久化引擎                          | Web      |

#### 日志

| 仓库                                                                       | 版本                                                                                                                      | 描述           | 平台          |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | -------------- | ------------- |
| [@redux-devtools/extension](https://github.com/reduxjs/redux-devtools)     | [![npm](https://img.shields.io/npm/v/@redux-devtools/extension)](https://www.npmjs.com/package/@redux-devtools/extension) | 浏览器日志插件 | Web, RN       |
| [react-native-debugger](https://github.com/jhen0409/react-native-debugger) | [![npm](https://img.shields.io/npm/v/react-native-debugger)](https://www.npmjs.com/package/react-native-debugger)         | 日志应用程序   | RN            |
| [redux-logger](https://github.com/LogRocket/redux-logger)                  | [![npm](https://img.shields.io/npm/v/redux-logger)](https://www.npmjs.com/package/redux-logger)                           | 控制台输出日志 | Web, RN, Taro |

# 常见疑问

### 函数里 this 的类型是 any

答：需要在文件 **tsconfig.json** 中开启`"strict": true`或者`"noImplicitThis": true`

---

更多答案请[查看文档](https://foca.js.org/#/troubleshooting)

# 捐赠

开源不易，升级维护框架和解决各种 issue 需要十分多的精力和时间。希望能得到你的支持，让项目处于良性发展的状态。捐赠地址：[二维码](https://foca.js.org#donate)

<table>
 <tr>
  <td align="center">
    <a target="_blank" href="https://github.com/arcsin1?donate_money=16.66">
      <img src="https://avatars.githubusercontent.com/u/13724222" width=80 height=80 style="border-radius: 100%;" />
    </a><br>
    <a target="_blank" href="https://github.com/arcsin1?donate_money=16.66">arcsin1</a>
  </td>
  <td align="center">
    <a target="_blank" href="https://github.com/xiongxliu?donate_money=50">
      <img src="https://avatars.githubusercontent.com/u/17661296" width=80 height=80 style="border-radius: 100%;" />
    </a><br>
    <a target="_blank" href="https://github.com/xiongxliu?donate_money=50">xiongxliu</a>
  </td>
 </tr>
</table>
