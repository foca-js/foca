#

# 函数里 this 的类型是 any

需要在文件 **tsconfig.json** 中开启`"strict": true`或者`"noImplicitThis": true`。

# 能用在哪些环境

只要和 react 挂钩的基本都没问题，下面列出常用环境：

- React Web
- React Native
- Taro
- Remax

# 没找到持久化守卫组件

内置在入口组件 `FocaProvider` 里了，初始化 store 的时候如果配置了 persist 属性，守卫会自动开启。

# this.dispatch 和 actions 的区别

互补关系。this.dispatch 是专门为网络请求和一些组合业务设置的快捷操作（直接传入 state 或者回调）。相对于一些不需要复用的 action 函数，用 dispatch 反而能让模型对外暴露更少的接口，组件里用起来就会更舒服一些。
