## [0.1.4](https://github.com/foca-js/foca/compare/v0.1.3...v0.1.4)

#### 2021-11-13

- 删除 tslib 依赖
- 定义模型时的属性 state 重构为 initialState，防止和 actions 的 state 变量名重叠以及 eslint 规则报错。

## [0.1.3](https://github.com/foca-js/foca/compare/v0.1.2...v0.1.3)

#### 2021-11-02

- action 的返回类型更新为 AnyAction
- 内部方法 dispatch 现支持**直接**传入完整的新 state。如果你只想更新 state 的某个值，则仍然使用回调。
- 修改异步方法报错时 action.type 的文字

## [0.1.2](https://github.com/foca-js/foca/compare/v0.1.1...v0.1.2)

#### 2021-11-01

- 存储引擎可自定义 keyPrefix 参数

## [0.1.1](https://github.com/foca-js/foca/compare/v0.1.0...v0.1.1)

#### 2021-10-31

- 存储引擎放回当前库

## [0.1.0](https://github.com/foca-js/foca/compare)

#### 2021-10-31

- 模块化
- 持久化
- 支持类型提示
- 支持 Map/Set
- 支持 immer
- 与其他 redux 库共存，方便迁移
