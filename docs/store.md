# <!-- {docsify-ignore} -->

# 仓库

foca 遵循`唯一store`原则，并提供了快速初始化的入口。

```typescript
// File: store.ts
import { store } from 'foca';

store.init();
```

好吧，就是这么简单！

# 入口

与原生 react-redux 类似，你需要把 foca 提供的 Provider 组件放置到入口文件，这样才能在业务组件中获取到数据。

<!-- tabs:start -->

#### ** React 18+ **

```tsx
import './store'; // 别忘了这行！！！
import ReactDOM from 'react-dom/client';
import { FocaProvider } from 'foca';
import App from './App';

const container = document.getElementById('root');
const root = ReactDOM.createRoot(container);

root.render(
  <FocaProvider>
    <App />
  </FocaProvider>,
);
```

#### ** React 16+ **

```tsx
import './store'; // 别忘了这行！！！
import ReactDOM from 'react-dom';
import { FocaProvider } from 'foca';
import App from './App';

const container = document.getElementById('root');

ReactDOM.render(
  <FocaProvider>
    <App />
  </FocaProvider>,
  container,
);
```

#### ** Taro.js **

```tsx
import './store'; // 别忘了这行！！！
import { Component } from 'react';
import { FocaProvider } from 'foca';

export default class App extends Component {
  render() {
    return <FocaProvider>{this.props.children}</FocaProvider>;
  }
}
```

<!-- tabs:end -->

# 热更新

<small>如果是 React-Native，你可以跳过这一节。</small>

因为 store.ts 需要被入口文件引入，而 store.ts 又引入了部分 model（持久化需要这么做），所以如果相应的 model 做了修改操作时，会导致浏览器页面全量刷新而非热更新。如果你正在使用当前流行的打包工具，建议加上`hot.accept`手动处理模块更新。

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

store.init(...);

// 如果是ESM项目，亦可尝试：import.meta.webpackHot
// https://webpack.docschina.org/api/hot-module-replacement/
if (module.hot) {
  module.hot.accept(() => {
    console.log('Hot updated: store');
  });
}
```

<!-- tabs:end -->

# 日志

- 对于 Web 项目，需要安装 Chrome 的 [redux-devtools](https://github.com/reduxjs/redux-devtools) 扩展，然后打开控制台查看。
- 对于 React-Native 项目，则是需要安装并启动软件 [react-native-debugger](https://github.com/jhen0409/react-native-debugger)，然后点击 App 里的按钮 `Debug with Chrome`。

接着，我们在 store 里注入增强函数：

```typescript
store.init({
  middleware: [...],
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
  middleware: [...],
  compose(enhancer) {
    return compose(enhancer, ...more[]);
  },
});
```

---

如果你不想安装扩展，控制台日志也可以实现相同的效果，只需安装下面的包就行了：

```bash
yarn add redux-logger @types/redux-logger --dev
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
