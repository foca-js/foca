# <!-- {docsify-ignore} -->

# 函数里 this 的类型是 any

需要在文件 **tsconfig.json** 中开启`"strict": true`或者`"noImplicitThis": true`。

# 为什么要用 this

1. 可调用额外的内部属性和方法；
2. 可调用自定义的私有方法；
3. 方便克隆(cloneModel)，this 作为 context 是可变的。

# 没找到持久化守卫组件

内置在入口组件 `FocaProvider` 里了，初始化 store 的时候如果配置了 persist 属性，守卫会自动开启。

# setState 和 reducers 的区别

互补关系。methods.setState 是专门为网络请求和一些组合业务设置的快捷操作（直接传入 state 或者回调）。相对于一些不需要复用的 reducer 函数，用 setState 反而能让模型对外暴露更少的接口，组件里用起来就会更舒服一些。

# 追踪 methods 的执行状态有性能问题吗

没有。我们已经知道如果想获得状态，就必须通过`useLoading`, `getLoading` 这些 api 获取，但如果你没有显性地通过这些 api 获取某个函数的状态，就不会触发该函数的状态追踪逻辑，即自动忽略。

状态数据使用独立的内部 store 存储，任何变动都不会触发模型数据(useModel, connect)的重新检查。

# 浏览器兼容性如何

npm包已经转译成ES5的语法，适用于大部分新旧浏览器（符合中国国情），但是仍有两个ES6的API `Promise` 和`Object.assign`。对于webpack、vite、rollup等一众打包工具，这两个API都会使用垫片(polyfill)处理，所以无需担心。

# 为什么不支持 SSR

因为 foca 是遵循单一 store 存储（单例），它的优点就是 model 创建后无需手动注册，在 CSR(Client-Side-Rendering) 中用起来很流畅。而 SSR(Server-Side-Rendering) 方案中，node 进程常驻于内存，这意味着所有的请求都会共享同一个 store，数据也必然会乱套。所以一些 SSR 框架比如 next.js, remix 都无法使用了。

再者，需要SSR的页面，一般是需要 SEO 的展示页，这种项目也用不上状态管理。并且 SSR 其实不是唯一的 SEO 优化方案，利用 user-agent 配合服务端动态渲染一样可以搞定，参考文章：https://segmentfault.com/a/1190000023481810

# this.initialState 是否多余

大部分情况下你会觉得多余，直到你使用`cloneModel`复制出一个新的模型。我们允许复制模型的同时修改初始值，所以`this.initialState`就和`this.state`一样能明确自己归属于哪个模型。

同时，每次获取`this.initialState`，框架都会返回给你一份全新的数据（deep clone)，这样再也不怕你会改动初始值了。

# 命名有什么建议

模型文件名建议采用 `some-word.model.ts` 这种命名方式，可读性好。<br/>
模型内容建议采用 `export const someWordModel = defineModel('some-word')` 驼峰的方式来创建，变量名和模型名具有一定的关联性，也不容易与其它模型冲突。
