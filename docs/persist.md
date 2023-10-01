# 持久化

持久化是自动把数据通过引擎存储到某个空间的过程。

如果你的某个 api 数据常年不变，那么建议你把它扔到本地做个缓存，这样用户下次再访问你的页面时，可以第一时间看到缓存的内容。如果你不想让用户每次刷新页面就重新登录，那么持久化很适合你。

# 入口

你需要在初始化 store 时开启持久化

```typescript
// File: store.ts
import { store, engines } from 'foca';
import { userModel } from './userModel';
import { agentModel } from './agentModel';

store.init({
  persist: [
    {
      key: '$PROJECT_$ENV',
      version: 1,
      engine: engines.localStorage,
      // 模型白名单列表
      models: [userModel, agentModel],
    },
  ],
});
```

把需要持久化的模型扔进去，foca 就能自动帮你存取数据。

`key`即为存储路径，最好采用**项目名-环境名**的形式组织。纯前端项目如果和其他前端项目共用一个域名，或者在同一域名下，则有可能使用共同的存储空间，因此需要保证`key`是唯一的值。

# 存储引擎

不同的引擎会把数据存储到不同的空间，使用哪个引擎取决于项目跑在什么环境。为了统一操作，引擎操作都是异步的，目前内置的引擎有：

- localStorage
- sessionStorage
- memoryStorage

如果内置引擎无法满足，那么安装下面列举的第三方库也可以**直接当作**存储引擎：

- [localforage](https://www.npmjs.com/package/localforage) (localStorage, IndexedDB, WebSQL) - 浏览器专用
- [@react-native-async-storage/async-storage](https://www.npmjs.com/package/@react-native-async-storage/async-storage) - React-Native专用
- [foca-taro-storage](https://github.com/foca-js/foca-taro-storage) - Taro专用
- [foca-cookie-storage](https://github.com/foca-js/foca-cookie-storage) - 浏览器专用，存储到cookie

如果有必要，你也可以自己实现一个引擎：

```typescript
import { StorageEngine } from 'foca';

export const customEngine: StorageEngine = {
  getItem(key) {},
  setItem(key, value) {},
  removeItem(key) {},
  clear() {},
};
```

# 设置版本号

当数据结构变化，我们不得不升级版本号来`删除`持久化数据，版本号又分为`全局版本`和`模型版本`两种。当修改模型内版本号时，仅删除该模型的持久化数据，而修改全局版本号时，白名单内所有模型的持久化数据都被删除。

建议优先修改模型内版本号！！

```diff
const stockModel = defineModel('stock', {
  initialState: {},
  persist: {
    // 模型版本号，影响当前模型
+   version: '2.0',
  },
});

store.init({
  persist: [
    {
      key: '$PROJECT_normal_$ENV',
      // 全局版本号，影响白名单全部模型
+     version: '3.6',
      engine: engines.localStorage,
      models: [musicModel, stockModel],
    },
  ],
});
```

# 数据合并

> v3.0.0

在项目的推进过程中，难免需要根据产品需求更新模型数据结构，结构变化后，我们可以简单粗暴地通过`版本号+1`的方式来删除持久化的数据。但如果只是新增了某一个字段，我们希望持久化恢复时能自动识别。试试推荐的`合并模式`吧：

```diff
store.init({
  persist: [
    {
      key: 'myproject-a-prod',
      version: 1,
+     merge: 'merge',
      engine: engines.localStorage,
      models: [userModel],
    },
  ],
});
```

很轻松就设置上了，合并模式目前有3种可选的类型：

- `replace` - 覆盖模式。数据从存储引擎取出后直接覆盖初始数据
- `merge` - 合并模式（默认）。数据从存储引擎取出后，与初始数据多余部分进行合并，可以理解为 **Object.assign()** 操作
- `deep-merge` - 二级合并模式。在合并模式的基础上，如果某个key的值为对象，则该对象也会执行合并操作

如果某个模型比较特殊，我们也可以在里面单独设置合并模式。

```diff
const userModel = defineModel('user', {
  initialState: {},
  persist: {
+   merge: 'deep-merge',
  },
});
```

接下来看看它的具体表现：

```typescript
const persistState = { obj: { test1: 'persist' } };
const initialState = { obj: { test2: 'initial' }, foo: 'bar' };

// replace 效果
const state = { obj: { test1: 'persist' } };
// merge 效果
const state = { obj: { test1: 'persist' }, foo: 'bar' };
// deep-merge 效果
const state = { obj: { test1: 'persist', test2: 'initial' }, foo: 'bar' };
```

需要注意的是合并模式对`数组无效`，当持久化数据和初始数据都为数组类型时，会强制使用持久化数据。当持久化数据和初始数据任何一边为数组类型时，会强制使用初始化数据。

```typescript
const persistState = [1, 2, 3];  ✅
const initialState = [4, 5, 6, 7];  ❌
// 合并效果
const state = [1, 2, 3];

// -------------------------

const persistState = [1, 2, 3];  ❌
const initialState = { foo: 'bar' };  ✅
// 合并效果
const state = { foo: 'bar' };

// -------------------------

const persistState = { foo: 'bar' };  ❌
const initialState = [1, 2, 3];  ✅
// 合并效果
const state = [1, 2, 3];
```

# 系列化钩子

> v3.0.0

数据在模型与持久化引擎互相转换期间，我们希望对它进行一些额外操作以满足业务需求。比如：

- 只缓存部分字段，避免存储尺寸超过存储空间限制
- 改变数据结构或者内容
- 更新时间等动态信息

foca提供了一对实用的过滤函数`dump`和`load`。**dump** 即 model->persist，**load** 即 persist->model。

```typescript
const model = defineModel('model', {
  initialState: {
    mode: 'foo', // 本地的设置，需要持久化缓存
    hugeDate: [], // API请求数据，数据量太大
  },
  persist: {
    // 系列化
    dump(state) {
      return state.mode;
    },
    // 反系列化
    load(mode) {
      return { ...this.initialState, mode };
    },
  },
});
```

# 分组

我们注意到 persist 其实是个数组，这意味着你可以多填几组配置上去，把不同的模型数据存储到不同的地方。这看起来很酷，但我猜你不一定需要！

```typescript
import { store, engines } from 'foca';

store.init({
  persist: [
    {
      key: 'myproject-a-prod',
      version: 1,
      engine: engines.localStorage,
      models: [userModel],
    },
    {
      key: 'myproject-b-prod',
      version: 5,
      engine: engines.sessionStorage,
      models: [agentModel, teacherModel],
    },
    {
      key: 'myproject-vip-prod',
      version: 1,
      engine: engines.localStorage,
      models: [customModel, otherModel],
    },
  ],
});
```
