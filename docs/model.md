#

# Model

原生的 redux 由 actions/types/reducer 三个部分组成，大多数情况我们会分成 3 个文件分别存储。在实际使用中，这种模板式的书写方式不仅繁琐，而且难以将他们关联起来，类型提示就更麻烦了。

基于此，我们提出了模型概念，以 state 为核心，任何更改 state 的操作都应该放在一起。

```typescript
// models/userModel.ts
import { defineModel } from 'foca';

export interface UserItem {
  id: number;
  name: string;
  age: number;
}

const initialState: UserItem[] = [];

export const userModel = defineModel('users', {
  initialState,
});
```

你已经定义了一个简单的可用的模型，通过 **export** 关键字，你已经可以在 react 组件中导入并使用它了。

!> foca 会自动把模型注册到 store 中心，这就是你能在组件中直接导入使用的秘密。

# State

foca 基于 redux 深度定制，所以理论上 state 必须是个纯对象。但因为第三方库 immer 的加入，state 允许使用 Map/Set 来处理数据了。

```typescript
// 1
cosnt initialState = new Map<string, string>();
defineModel('model-map', {
  initialState,
});

// 2
cosnt initialState = new Set<string>();
defineModel('model-set', {
  initialState,
});

// 3
cosnt initialState: {
  data1: Set<string>;
  data2: Map<string, string>;
  data3: number;
  data4: { [k: string]: string };
} = {
    data1: new Set(),
    data2: new Map(),
    data3: 1,
    data4: {},
};
defineModel('model-map-set', {
  initialState,
});
```

# Actions

模型光有 state 也不行，你现在拿到的就是一个空数组([])。加点数据上去吧，这时候就要用到 action：

```typescript
export const userModel = defineModel('users', {
  initialState,
  actions: {
    addUser(state, user: UserItem) {
      state.push(user);
    },
    updateName(state, id: number, name: string) {
      const user = state.find((item) => item.id === id);
      if (user) {
        user.name = name;
      }
    },
    removeUser(state, userId: number) {
      const index = state.findIndex((item) => item.id === id);
      if (index >= 0) {
        state.splice(index, 1);
      }
    },
    clear() {
      return this.initialState;
    },
  },
});
```

就这么干，你已经赋予了模型生命，你等下可以和它互动了。现在，我们来说说这些 actions 需要注意的几个点：

- 函数的第一个参数一定是 state ，而且它是能自动识别到类型`State`的，你不用刻意地去指定。
- 函数是可以带多个参数的，这全凭你自己的喜好。
- 函数体内可以直接修改 state 对象（数组也属于对象）里的任何内容，这得益于 [immer](https://github.com/immerjs/immer) 的功劳。
- 函数返回值必须是`State`类型。当然你也可以不返回，这时 foca 会认为你正在直接修改 state。
- 如果你想使用`this`上下文，比如上面的 **clear()** 函数返回了初始值，那么请~~不要使用箭头函数~~。

# Effects

不可否认，你的数据不可能总是凭空捏造，在真实的业务场景中，数据总是通过接口获得，然后保存到 state 中。foca 贴心地为你准备了异步函数，快来试试吧：

```typescript
const userModel = defineModel('users', {
  initialState,
  effects: {
    async get() {
      const users = await http.get<UserItem[]>('/users');
      this.dispatch(users);
    },
    async retrieve(id: number) {
      const user = await http.get<UserItem>(`/users/${id}`);
      this.dispatch((state) => {
        state.push(user);
      });
    },
  },
});
```

瞧见没，你可以在 effects 里自由地使用 async/await 方案，然后通过`this.dispatch`快速更新 state。

你是否注意到 dispatch 的三种调用方式：

1. 直接传递新的且完整的 state。
2. 通过回调匿名函数更新 state 的部分数据。
3. 通过回调匿名函数返回新的且完整的 state。

如果你压根就不想用`this.dispatch`，你觉得这样看起来很混乱？OK，你突然想起可以使用 actions 去改变 state 不是吗？

```typescript
const userModel = defineModel('users', {
  initialState,
  actions: {
    addUser(state, user: UserItem) {
      state.push(user);
    },
  },
  effects: {
    async retrieve(id: number) {
      const user = await http.get<UserItem>(`/users/${id}`);
      this.addUser(user);
    },
  },
});
```

是的，这样看起来更纯粹一些，代价就是要委屈你多写几行代码了。

# 克隆

虽然比较不常用，但有时候为了同一个页面的不同模块能独立使用模型数据，你就得需要复制这个模型，并把名字改掉。其实也不用这么麻烦，foca 给你来个惊喜：

```typescript
import { defineModel, cloneModel } from 'foca';

// 你打算用在各个普通页面里。
cosnt userModel = defineModel('users', { ... });

// 你打算用在通用的用户列表弹窗里。
const user1Model = cloneModel('users1', userModel);
// 你打算用在页头或页脚模块里。
const user2Model = cloneModel('users2', userModel);
```

共享方法但状态是独立的，这是个不错的主意，你只要维护一份代码就行了。
