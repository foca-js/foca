# <!-- {docsify-ignore} -->

# 安装

```bash
# npm
npm install foca
# yarn
yarn add foca
# pnpm
pnpm add foca
```

# 激活

foca 遵循`唯一store`原则，并提供了快速初始化的入口。

```typescript
// File: store.ts
import { store } from 'foca';

store.init();
```

好吧，就是这么简单！

# 导入

与原生 react-redux 类似，你需要把 foca 提供的 Provider 组件放置到入口文件，这样才能在业务组件中获取到数据。

<!-- tabs:start -->

#### ** React **

```diff
+ import './store';
+ import { FocaProvider } from 'foca';
import ReactDOM from 'react-dom/client';
import App from './App';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
+ <FocaProvider>
    <App />
+ </FocaProvider>
);
```

#### ** Taro.js **

```diff
+ import './store';
+ import { FocaProvider } from 'foca';
import { Component } from 'react';

export default class App extends Component {
  render() {
-   return this.props.children;
+   return <FocaProvider>{this.props.children}</FocaProvider>;
  }
}
```

<!-- tabs:end -->

# 日志

在开发阶段，如果你想实时查看状态的操作过程以及数据的变化细节，那么开启可视化界面是必不可少的一个环节。

<!-- tabs:start -->

#### ** 全局软件 **

**优势:** 一次安装，所有项目都可以无缝使用。

- 对于 Web 项目，可以安装 Chrome 浏览器的 [redux-devtools](https://github.com/reduxjs/redux-devtools) 扩展，然后打开控制台查看。
- 对于 React-Native 项目，可以安装并启动软件 [react-native-debugger](https://github.com/jhen0409/react-native-debugger)，然后点击 App 里的按钮 `Debug with Chrome`即可连接软件，其本质也是 Chrome 的控制台

接着，我们在 store 里注入增强函数：

```typescript
store.init({
  // 字符串 redux-devtools 即 window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ 的缩写
  // 设置 redux-devtools 在生产环境(process.env.NODE_ENV === 'production')下会自动关闭
  // 你也可以安装等效的插件包 @redux-devtools/extension 自由控制
  compose: 'redux-devtools',
});
```

compose 也支持回调形式，目的是为了注入更多插件。

```typescript
import { composeWithDevTools as compose } from '@redux-devtools/extension';
// 或者使用原生的compose
// import { compose } from 'foca';

store.init({
  compose(enhancer) {
    return compose(enhancer, ...more[]);
  },
});
```

#### ** 项目插件 **

**优势:** 可选配置参数多，且在 Web 和 React-Native 中都能使用。

```bash
# npm
npm install redux-logger @types/redux-logger --save-dev
# yarn
yarn add redux-logger @types/redux-logger --dev
# pnpm
pnpm add redux-logger @types/redux-logger -D
```

接着我们把这个包注入 store：

```typescript
import { store, Middleware } from 'foca';
import { createLogger } from 'redux-logger';

const middleware: Middleware[] = [];

if (process.env.NODE_ENV !== 'production') {
  middleware.push(
    createLogger({
      collapsed: true,
      diff: true,
      duration: true,
      logErrors: true,
    }),
  );
}

store.init({
  middleware,
});
```

大功告成，下次你对 store 的数据做操作时，控制台就会有相应的通知输出。

<!-- tabs:end -->

# 开发热更

<small>如果是 React-Native，你可以跳过这一节。</small>

因为 store.ts 需要被入口文件引入，而 store.ts 又引入了部分 model（<small>持久化需要这么做</small>），所以如果相应的 model 做了修改操作时，会导致浏览器页面全量刷新而非热更新。如果你正在使用当前流行的打包工具，强烈建议加上`hot.accept`手动处理模块更新。

<!-- tabs:start -->

#### ** Vite **

```typescript
// File: store.ts

store.init(...);

// https://cn.vitejs.dev/guide/api-hmr.html#hot-acceptcb
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log('Hot updated: store');
  });
}
```

#### ** Webpack **

```typescript
// File: store.ts

// ##################################################
// ######                                     #######
// ###### yarn add @types/webpack-env --dev   #######
// ######                                     #######
// ##################################################

store.init(...);

// https://webpack.docschina.org/api/hot-module-replacement/
if (module.hot) {
  module.hot.accept(() => {
    console.log('Hot updated: store');
  });
}
```

#### ** Webpack ESM **

```typescript
// File: store.ts

// ##################################################
// ######                                     #######
// ###### yarn add @types/webpack-env --dev   #######
// ######                                     #######
// ##################################################

store.init(...);

// https://webpack.docschina.org/api/hot-module-replacement/
if (import.meta.webpackHot) {
  import.meta.webpackHot.accept(() => {
    console.log('Hot updated: store');
  });
}
```

<!-- tabs:end -->
