# FOCA

流畅的 react 状态管理库，基于[redux](https://github.com/reduxjs/redux)和[react-redux](https://github.com/reduxjs/react-redux)。简洁、极致、高效。

[![npm peer dependency version](https://img.shields.io/npm/dependency-version/foca/peer/react)](https://github.com/facebook/react)
[![LGTM Grade](https://img.shields.io/lgtm/grade/javascript/github/foca-js/foca?label=code%20quality)](https://lgtm.com/projects/g/foca-js/foca)
[![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/foca-js/foca/Test/master?label=test)](https://github.com/foca-js/foca/actions)
[![Codecov](https://img.shields.io/codecov/c/github/foca-js/foca)](https://codecov.io/gh/foca-js/foca)
[![npm](https://img.shields.io/npm/v/foca)](https://www.npmjs.com/package/foca)
[![npm bundle size (version)](https://img.shields.io/bundlephobia/minzip/foca?label=bundle+size)](https://bundlephobia.com/package/foca@latest)
![GitHub top language](https://img.shields.io/github/languages/top/foca-js/foca)
[![License](https://img.shields.io/github/license/foca-js/foca)](https://github.com/foca-js/foca/blob/master/LICENSE)

<br>

![mind map](./mindMap.svg)

# 安装

```bash
# 如果是 yarn
yarn add foca

# 如果是 npm
npm install foca
```

# 特性

#### 模块化开发

一个模型包含了状态操作的所有方法，基础代码全部剥离，不再像原生 redux 一般拆分成 action/types/reducers 三个文件，既不利于管理，又难以在提示上关联起来。

#### 专注 typescript 极致体验

foca 提供 **100%** 的基础类型提示，你只需关注业务中的类型。

#### 模型自动注册，导出即可使用

定义完模型，导出即可在组件中使用，foca 已经自动为你注册了，不用再怕忘记或者嫌麻烦了。

#### 内置 immer 快速处理数据

可以说加入 immer 是非常有必要的，当 reducer 数据多层嵌套时，你不必再忍受更改里层的数据而不断使用 rest/spread(...)扩展符的烦恼，相反地，直接赋值就好了，其他的交给 immer 搞定。

#### 支持 computed 计算属性

不需要再羡慕`vue`或者`mobx`等框架的计算属性了，foca 虽然基于 redux，但是也能支持计算属性并且自动收集依赖。

#### 智能追踪异步函数的执行状态

我们总是想知道某个异步方法（或者请求）正在执行，然后在页面上渲染出`loading...`字样，幸运地是框架提供了判断的入口。如果方法抛出异常，框架还能收集到错误的信息。

#### 模型支持私有方法

一个下划线(\_)就能让方法变成私有的，再也不用担心被乱用了。

#### 可定制的多引擎数据持久化

某些数据在一个时间段内可能是不变的，比如登录凭证 token。所以你想着先把数据存到本地，下次自动恢复到模型中，这样用户就不需要频繁登录了。

#### 数据隔离，允许同类状态库并存

如果你的项目正在使用 redux 或者基于 redux 封装的第三方库，也不用当心冲突，foca 是独立存在的，不会破坏原有的数据，你可以毫无顾虑地使用它。

这其实也方便你有序地把旧的 redux 慢慢迁移到这里。

# 例子

React 案例仓库：https://github.com/foca-js/foca-demo-web
<br>
RN 案例仓库：https://github.com/foca-js/foca-demo-react-native
<br>
Taro 案例仓库：https://github.com/foca-js/foca-demo-taro
<br>

# 在线试玩

<iframe src="https://codesandbox.io/embed/foca-demos-e8rh3?fontsize=14&hidenavigation=1&theme=dark&view=preview"
     style="width:100%; height:600px; border:0; border-radius: 4px; overflow:hidden;"
     title="foca-demos"
     allow="accelerometer; ambient-light-sensor; camera; encrypted-media; geolocation; gyroscope; hid; microphone; midi; payment; usb; vr; xr-spatial-tracking"
     sandbox="allow-forms allow-modals allow-popups allow-presentation allow-same-origin allow-scripts"
   ></iframe>
