# <!-- {docsify-ignore} -->

# Store

Foca assume `one store` principle, let's initialize it now.

```typescript
// File: store.ts
import { store } from 'foca';

store.init();
```

WOW, so easy, right?

# Entry

Import `FocaProvider` from foca that is the same as Provider from react-redux

<!-- tabs:start -->

#### ** React 18+ **

```tsx
import './store'; // Don't forget this line
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
import './store'; // Don't forget this line
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
import './store'; // Don't forget this line
import { Component } from 'react';
import { FocaProvider } from 'foca';

export default class App extends Component {
  render() {
    return <FocaProvider>{this.props.children}</FocaProvider>;
  }
}
```

#### ** Next.js **

```tsx
import '../app/store'; // Don't forget this line
import { FocaProvider } from 'foca';
import type { AppProps } from 'next/app';

export default function Root({ Component, pageProps }: AppProps) {
  return (
    <FocaProvider>
      <Component {...pageProps} />
    </FocaProvider>
  );
}
```

<!-- tabs:end -->

# Hot Reload

<small>Skip this section for React-Native developers</small>

The browser page may full refresh when model file saved. Why? For persitence, you need to import some models into `store.ts` which is imported by entry file. Consider add `hot.accept` logic to store.ts file.

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

// For ESM, you can try `import.meta.webpackHot`
// https://webpack.docschina.org/api/hot-module-replacement/
if (module.hot) {
  module.hot.accept(() => {
    console.log('Hot updated: store');
  });
}
```

<!-- tabs:end -->

# Log

- For **web** env, install Chrome extention [redux-devtools](https://github.com/reduxjs/redux-devtools) and inspect devtools .
- For **RN** env, install and launch [react-native-debugger](https://github.com/jhen0409/react-native-debugger) application, and click `Debug with Chrome` from RN app.

And then, let's inject enhanced function into store:

```typescript
store.init({
  middleware: [...],
  // Literal redux-devtools means window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__
  // Literal redux-devtools will be removed in production mode (process.env.NODE_ENV === 'production')
  // Also can control enhanced function by @redux-devtools/extension
  compose: 'redux-devtools',
});
```

To inject more enhancers, try callback way:

```typescript
import { composeWithDevTools as compose } from '@redux-devtools/extension';
// import { compose } from 'foca';

store.init({
  middleware: [...],
  compose(enhancer) {
    return compose(enhancer, ...more[]);
  },
});
```

---

Just install lightweight package if you don't want to install browser extension

```bash
yarn add redux-logger @types/redux-logger --dev
```

We should inject redux-logger to middleware:

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

Now, Press `F12` and switch to `Console`, you can see redux log every time you are executing actions or effects.
