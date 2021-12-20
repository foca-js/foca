#

# 仓库

foca 遵循唯一 store 原则，foca 提供了快速初始化的入口。

```typescript
// File: store.ts
import { store } from 'foca';

store.init();
```

好吧，就是这么简单！

# 入口

与原生 react-redux 类似，你需要把 foca 提供的 Provider 组件放置到入口文件，这样才能在业务组件中获取到数据。

```tsx
// File: index.tsx
import './store'; // 别忘了这行！

import ReactDOM from 'react-dom';
import { FocaProvider } from 'foca';
import App from './App';

ReactDom.render(
  <FocaProvider>
    <App />
  </FocaProvider>,
  document.getElementById('root'),
);
```

# 热更新

<small>如果是 React-Native，你可以跳过这一节。</small>

因为 store.ts 需要被入口文件引入，而 store.ts 又引入了部分 model，所以如果相应的 model 做了修改操作时，会导致浏览器页面全量刷新而非热更新。如果你正在使用当前流行的打包工具，建议加上`hot.accept`手动处理模块更新。

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

如果你已经安装了 Chrome 浏览器的 [redux-devtools](https://github.com/zalmoxisus/redux-devtools-extension) 扩展，那么可以直接在初始化 store 时指定。

```typescript
store.init({
  compose: process.env.NODE_ENV === 'production' ? void 0 : 'redux-devtools',
});
```

!> 对于 process 对象，你需要安装@types/node 包才能得到提示。

如果你没有安装扩展，也不需要气馁，控制台也可以实现相同的效果，只需安装下面的包就行了：

```bash
yarn add @types/redux-logger redux-logger --dev
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
