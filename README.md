# FOCA

基于 redux 的现代化 react 状态管理库。简洁、极致、高效。

[![License](https://img.shields.io/github/license/foca-js/foca)](https://github.com/foca-js/foca/blob/master/LICENSE)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/foca-js/foca/CI/master)](https://github.com/foca-js/foca/actions)
[![Codecov](https://img.shields.io/codecov/c/github/foca-js/foca)](https://codecov.io/gh/foca-js/foca)
[![npm](https://img.shields.io/npm/v/foca)](https://www.npmjs.com/package/foca)
[![npm bundle size (version)](https://img.shields.io/bundlephobia/minzip/foca/latest?label=bundle+size)](https://bundlephobia.com/package/foca@latest)
[![npm peer dependency version](https://img.shields.io/npm/dependency-version/foca/peer/react)](https://github.com/facebook/react)

# 特性

- 模块化开发
- 专注 typescript 极致体验
- 支持 Map/Set 数据类型
- 内置 immer 快速处理状态
- 异步方法自动追踪状态
- 可定制的多引擎数据持久化
- 数据隔离，允许多个状态库并存
- 模型自动注册，拒绝繁琐

# 安装

```bash
yarn add foca
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
