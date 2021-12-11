#

# 函数里 this 的类型是 any

需要在文件 **tsconfig.json** 中开启`"strict": true`或者`"noImplicitThis": true`。

# 能用在哪些环境

只要是 react 系列的基本都没问题，下面列出常用环境：

- React Web
- React Native
- Taro
- Remax

# 没找到持久化守卫组件

内置在入口组件 `FocaProvider` 里了，初始化 store 的时候如果配置了 persist 属性，守卫会自动开启。

# effects.setState 和 actions 的区别

互补关系。effects.setState 是专门为网络请求和一些组合业务设置的快捷操作（直接传入 state 或者回调）。相对于一些不需要复用的 action 函数，用 setState 反而能让模型对外暴露更少的接口，组件里用起来就会更舒服一些。

# 追踪 effect 的执行状态有性能问题吗

没有。我们已经知道如果想获得状态，就必须通过`useMeta`, `useLoading`, `getMeta`, `getLoading` 这些 api 获取，但如果你没有显性地通过这些 api 获取某个函数的状态，就不会触发该函数的状态追踪逻辑，即自动忽略。

状态数据使用独立的内部 store 存储，任何变动都不会触发模型数据(useModel, connect)的重新检查。
