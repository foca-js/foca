## [0.9.1](https://github.com/foca-js/foca/compare/v0.9.0...v0.9.1)&nbsp;&nbsp;(2021-12-20)

- 在开发环境下允许多次执行`store.init()`以适应热重载
- 持久化解析失败时一律抛出异常

## [0.9.0](https://github.com/foca-js/foca/compare/v0.8.1...v0.9.0)&nbsp;&nbsp;(2021-12-17)

- [Breaking] 删除 `useMeta()`, `getMeta()` 接口，移除 meta 概念
- 修复 IDE 中 React 组件调用的模型方法无法点击跳转回模型的问题

## [0.8.1](https://github.com/foca-js/foca/compare/v0.8.0...v0.8.1)&nbsp;&nbsp;(2021-12-17)

- 私有方法在运行时也不该被导出

## [0.8.0](https://github.com/foca-js/foca/compare/v0.7.1...v0.8.0)&nbsp;&nbsp;(2021-12-17)

- 支持私有方法，在模型外部使用会触发 TS 报错（属性不存在）

## [0.7.1](https://github.com/foca-js/foca/compare/v0.7.0...v0.7.1)&nbsp;&nbsp;(2021-12-13)

- 通过缓存提升 useModel 的性能

## [0.7.0](https://github.com/foca-js/foca/compare/v0.6.0...v0.7.0)&nbsp;&nbsp;(2021-12-12)

- [Breaking] ctx.dispatch 重命名为 ctx.setState

```diff
difineModel('name', {
  effects: {
    foo() {
-     this.dispatch({ count: 1 });
+     this.setState({ count: 1 });
    }
  }
})
```

- 删除部分继承的 Error 类，直接使用原生 Error
- 过期的持久化数据不再自动重新生成

## [0.6.0](https://github.com/foca-js/foca/compare/v0.5.0...v0.6.0)&nbsp;&nbsp;(2021-12-10)

- [Breaking] 删除 Map/Set 特性
- 内置并简化深对比函数

## [0.5.0](https://github.com/foca-js/foca/compare/v0.4.1...v0.5.0)&nbsp;&nbsp;(2021-12-09)

- [Breaking] effect.meta() 重命名为 effect.assign()

```diff
- model.effect.meta(ID).execute(...);
+ model.effect.assign(ID).execute(...);
```

- [Breaking] {get|use}Meta 和 {get|use}Loading 的 pick() 重命名为 find()

```diff
- useLoading(model.effect, 'pick').pick(ID)
+ useLoading(model.effect.assign).find(ID)

- useLoading(model.effect, 'pick', ID)
+ useLoading(model.effect.assign, ID)
```

- 取消导出部分 redux 模块
- 增加 metas 和 loadings 在开发环境下的不可变特性

## [0.4.1](https://github.com/foca-js/foca/compare/v0.4.0...v0.4.1)&nbsp;&nbsp;(2021-12-08)

- 修复循环引用问题

## [0.4.0](https://github.com/foca-js/foca/compare/v0.3.6...v0.4.0)&nbsp;&nbsp;(2021-12-08)

- [Breaking] 删除重复且难以理解的 api `useLoadings`, `useMetas`, `getLoadings`, `getMetas`

## [0.3.6](https://github.com/foca-js/foca/compare/v0.3.5...v0.3.6)&nbsp;&nbsp;(2021-12-04)

- 模型增加钩子函数 onInit
- 修复 getLoadings 和 useLoadings 始终返回新对象的问题

## [0.3.5](https://github.com/foca-js/foca/compare/v0.3.4...v0.3.5)&nbsp;&nbsp;(2021-12-01)

- 使用 Object.assign 代替插件包 object-assign
- 增加 combine() 函数以覆盖状态库共存时使用 connect() 高阶组件的场景

## [0.3.4](https://github.com/foca-js/foca/compare/v0.3.3...v0.3.4)&nbsp;&nbsp;(2021-11-29)

- 提升 useModel 在传递单个模型时的执行效率
- useModel 没有传回调函数时，不再提供对比算法参数

## [0.3.3](https://github.com/foca-js/foca/compare/v0.3.2...v0.3.3)&nbsp;&nbsp;(2021-11-28)

- react 最小依赖版本现在为 16.9.0
- 优化 dispatch 性能
- 引入 process.env.NODE_ENV 以减少生产环境的体积

## [0.3.2](https://github.com/foca-js/foca/compare/v0.3.1...v0.3.2)&nbsp;&nbsp;(2021-11-27)

- 精简代码
- 内置插件包 symbol-observable

## [0.3.1](https://github.com/foca-js/foca/compare/v0.3.0...v0.3.1)&nbsp;&nbsp;(2021-11-26)

- 升级 immer 版本
- 重写 action 和 effect 增强函数

## [0.3.0](https://github.com/foca-js/foca/compare/v0.2.3...v0.3.0)&nbsp;&nbsp;(2021-11-24)

- [Breaking] keepStateFromRefresh 重命名为 skipRefresh
- 修复 dispatch meta 时未命中拦截条件
- 重构拦截器
- 重构 reducer 生成器
- 完善测试用例

## [0.2.3](https://github.com/foca-js/foca/compare/v0.2.2...v0.2.3)&nbsp;&nbsp;(2021-11-23)

- 对 action 进行拦截以避免无意义的状态更新和组件重渲染

## [0.2.2](https://github.com/foca-js/foca/compare/v0.2.1...v0.2.2)&nbsp;&nbsp;(2021-11-22)

- meta 数据使用新的内部 store 存储

## [0.2.1](https://github.com/foca-js/foca/compare/v0.2.0...v0.2.1)&nbsp;&nbsp;(2021-11-22)

- 异步函数中的`metaId()`重命名为`meta()`

## [0.2.0](https://github.com/foca-js/foca/compare/v0.1.5...v0.2.0)&nbsp;&nbsp;(2021-11-21)

- 增加及时状态方法：`getLoading`, `getLoadings`, `getMeta`, `getMetas`
- 增加 hooks 方法：`useLoadings`, `useMetas`
- meta 增加 type 字段，并由此检测 loading 状态

## [0.1.5](https://github.com/foca-js/foca/compare/v0.1.4...v0.1.5)&nbsp;&nbsp;(2021-11-19)

- useModel 可以手动传入对比算法，未传则由框架动态决策
- 提升异步状态追踪性能
- 提升数据合并性能

## [0.1.4](https://github.com/foca-js/foca/compare/v0.1.3...v0.1.4)&nbsp;&nbsp;(2021-11-13)

- 删除 tslib 依赖
- 定义模型时的属性 state 重构为 initialState，防止和 actions 的 state 变量名重叠以及 eslint 规则报错。

## [0.1.3](https://github.com/foca-js/foca/compare/v0.1.2...v0.1.3)&nbsp;&nbsp;(2021-11-02)

- action 的返回类型更新为 AnyAction
- 内部方法 dispatch 现支持**直接**传入完整的新 state。如果你只想更新 state 的某个值，则仍然使用回调。
- 修改异步方法报错时 action.type 的文字

## [0.1.2](https://github.com/foca-js/foca/compare/v0.1.1...v0.1.2)&nbsp;&nbsp;(2021-11-01)

- 存储引擎可自定义 keyPrefix 参数

## [0.1.1](https://github.com/foca-js/foca/compare/v0.1.0...v0.1.1)&nbsp;&nbsp;(2021-10-31)

- 存储引擎放回当前库

## [0.1.0](https://github.com/foca-js/foca/compare)&nbsp;&nbsp;(2021-10-31)

- 模块化
- 持久化
- 支持类型提示
- 支持 Map/Set
- 支持 immer
- 与其他 redux 库共存，方便迁移
