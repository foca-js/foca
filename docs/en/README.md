# FOCA

A fluent react state management library which based on [redux](https://github.com/reduxjs/redux)and [react-redux](https://github.com/reduxjs/react-redux). It's simple and efficient.

[![npm peer dependency version](https://img.shields.io/npm/dependency-version/foca/peer/react?logo=react)](https://github.com/facebook/react)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/foca-js/foca/Test/master?label=test&logo=jest)](https://github.com/foca-js/foca/actions)
[![Codecov](https://img.shields.io/codecov/c/github/foca-js/foca?logo=codecov)](https://codecov.io/gh/foca-js/foca)
[![npm](https://img.shields.io/npm/v/foca?logo=npm)](https://www.npmjs.com/package/foca)
[![npm bundle size (version)](https://img.shields.io/bundlephobia/minzip/foca?label=bundle+size&cacheSeconds=3600&logo=esbuild)](https://bundlephobia.com/package/foca@latest)
![GitHub top language](https://img.shields.io/github/languages/top/foca-js/foca?logo=typescript)
[![License](https://img.shields.io/github/license/foca-js/foca?logo=open-source-initiative)](https://github.com/foca-js/foca/blob/master/LICENSE)
[![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/foca-js/foca?label=code%20quality&logo=lgtm)](https://lgtm.com/projects/g/foca-js/foca)
[![Code Style](https://img.shields.io/badge/code_style-prettier-ff69b4.svg?logo=prettier)](https://github.com/prettier/prettier)
[![Gitter](https://img.shields.io/gitter/room/foca-js/foca?logo=gitter)](https://gitter.im/foca-js/foca)

<br>

![mind map](../mindMap.svg)

# Installation

```bash
yarn add foca
# OR
npm install foca
```

# Features

- Modular file, export then use it
- Get 100% typescript type checking
- Update state by builtin [immer](https://github.com/immerjs/immer) library
- Support computed state and collect deps automatically
- Support private methods
- Hold loading status for effect functions
- Persist store with multiple engines

# Ecosystem

#### Network request

| Repository                                                                  | Version                                                                                                             | Description                                            | Platforms |
| --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------ | --------- |
| [axios](https://github.com/axios/axios)                                     | [![npm](https://img.shields.io/npm/v/axios)](https://www.npmjs.com/package/axios)                                   | Popular http client                                    | React, RN |
| [foca-axios](https://github.com/foca-js/foca-axios)                         | [![npm](https://img.shields.io/npm/v/foca-axios)](https://www.npmjs.com/package/foca-axios)                         | axios adapter which supports throttle, cache and retry | React, RN |
| [foca-miniprogram-axios](https://github.com/foca-js/foca-miniprogram-axios) | [![npm](https://img.shields.io/npm/v/foca-miniprogram-axios)](https://www.npmjs.com/package/foca-miniprogram-axios) | axios adapter which supports throttle, cache and retry | Taro      |

#### Storage engines

| Repository                                                                                | Version                                                                                                                                                   | Description                 | Platforms |
| ----------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------- | --------- |
| [react-native-async-storage](https://github.com/react-native-async-storage/async-storage) | [![npm](https://img.shields.io/npm/v/@react-native-async-storage/async-storage)](https://www.npmjs.com/package/@react-native-async-storage/async-storage) | React-Native storage engine | RN        |
| [foca-taro-storage](https://github.com/foca-js/foca-taro-storage)                         | [![npm](https://img.shields.io/npm/v/foca-taro-storage)](https://www.npmjs.com/package/foca-taro-storage)                                                 | Taro storage engine         | Taro      |
| [localForage](https://github.com/localForage/localForage)                                 | [![npm](https://img.shields.io/npm/v/localforage)](https://www.npmjs.com/package/localforage)                                                             | Browser storage engine      | React     |

#### Log

| Repository                                                                 | Version                                                                                                                   | Description           | Platforms       |
| -------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------- | --------------------- | --------------- |
| [@redux-devtools/extension](https://github.com/reduxjs/redux-devtools)     | [![npm](https://img.shields.io/npm/v/@redux-devtools/extension)](https://www.npmjs.com/package/@redux-devtools/extension) | Browser log extension | React, RN       |
| [react-native-debugger](https://github.com/jhen0409/react-native-debugger) | [![npm](https://img.shields.io/npm/v/react-native-debugger)](https://www.npmjs.com/package/react-native-debugger)         | Log application       | RN              |
| [redux-logger](https://github.com/LogRocket/redux-logger)                  | [![npm](https://img.shields.io/npm/v/redux-logger)](https://www.npmjs.com/package/redux-logger)                           | Devtools console log  | React, RN, Taro |

# Demos

React demo: https://github.com/foca-js/foca-demo-web
<br>
RN demo: https://github.com/foca-js/foca-demo-react-native
<br>
Taro demo: https://github.com/foca-js/foca-demo-taro
<br>
Nextjs demo: https://github.com/foca-js/foca-demo-nextjs

# Sandbox online

<iframe src="https://codesandbox.io/embed/foca-demos-e8rh3?fontsize=14&hidenavigation=1&theme=dark&view=preview"
     style="width:100%; height:600px; border:0; border-radius: 4px; overflow:hidden;"
     title="foca-demos"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
