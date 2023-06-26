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
      models: [userModel, agentModel],
    },
  ],
});
```

把需要持久化的模型扔进去，foca 就能自动帮你存取数据。

# 参数说明

#### key

key 即为存储路径，最好采用`项目名-环境名`的形式组织。纯前端项目如果和其他前端项目共用一个域名，或者在同一域名下，你用 **index.html** 和 **index-test.html** 来访问不同的环境，这很容易导致 key 被覆盖。

#### engine

存储引擎。不同的引擎会把数据存储到不同的空间，使用哪个引擎取决于项目跑在什么环境。为了统一操作，引擎操作都是异步的，目前内置的引擎有：

- localStorage
- sessionStorage
- memoryStorage

如果内置引擎无法满足，那么下面列举的第三方库也可以**直接当作**存储引擎：

- Taro：[foca-taro-storage](https://github.com/foca-js/foca-taro-storage)
- React-Native：[@react-native-async-storage/async-storage](https://www.npmjs.com/package/@react-native-async-storage/async-storage)
- 浏览器：[localforage](https://www.npmjs.com/package/localforage)(localStorage, IndexedDB, WebSQL) | [foca-cookie-storage](https://github.com/foca-js/foca-cookie-storage)

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

#### version

版本号。如果数据结构有变化，那么可以直接升级版本号。

注意，**升级版本号会把相关模型的持久化数据都清除掉**，所以请谨慎操作！比如某个持久化模型存有用户 token 信息，那么升级 version 之后，用户再访问你的应用就得重新登录了。所以建议 tokenModel 放在独立的一个配置下，这样不容易被影响到：

```typescript
store.init({
  persist: [
    {
      key: '$PROJECT_normal_$ENV',
      version: 3.6,
      engine: engines.localStorage,
      // 普通的数据放一起
      models: [musicModel, stockModel],
    },
    {
      key: '$PROJECT_token_$ENV',
      version: 1,
      engine: engines.localStorage,
      // 十分重要的数据建议单独存放
      models: [tokenModel],
    },
    {
      key: '$PROJECT_important_$ENV',
      version: 2.1,
      engine: engines.localStorage,
      // 十分重要的数据建议单独存放
      models: [profileModel],
    },
  ],
});
```

修改全局配置的 version 总是危险的一意孤行的方式，因为没有人愿意改动某个模型后就大动干戈地清理掉所有模型的缓存数据，这是严重的内耗问题。所以现在，让我们试试模型里的持久化配置：

```typescript
const userModel = defineModel('user', {
  initialState: [],
  // 覆盖全局配置，只对当前模型有效
  persist: {
    version: 1,
  },
});
```

是的，如果有需要，每个模型都可以再次覆盖持久化配置以达到定制的需求。不要太方便呢！

#### maxAge

缓存存活时间。很显然这是针对每个模型的，因为不同模型的数据存入时间不一样，中途还可能更新缓存，所以模型的存活时间从最后一次更新开始计算。

你可以在模型中单独指定 maxAge 以达到定制效果：

```typescript
// File: store.ts
store.init({
  persist: [
    {
      ...
      maxAge: 30 * 60 * 1000,
      models: [userModel, agentModel, ...],
    }
  ]
});

// File: user.model.ts
const userModel = defineModel({
  initialState: [],
  persist: {
    maxAge: 10 * 60 * 1000,
  },
});
```

所有模型都会在 30 分钟后失效，除非它们在此期间更新了数据。其中有一个`userModel`的模型会在 10 分钟后就失效，这是你特别指定的。

!> 不填 maxAge 代表永久缓存。

#### models

缓存白名单。把你认为应该缓存的模型填进去。

# 分组

我们注意到 persist 其实是个数组，这意味着你可以多填几组配置上去，把不同的模型数据存储到不同的地方。这看起来很酷，但我猜你不一定需要。

```typescript
import { store, engines } from 'foca';

store.init({
  persist: [
    {
      key: 'myproject-prod',
      version: 1,
      engine: engines.localStorage,
      models: [userModel],
    },
    {
      key: 'myproject-prod',
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
