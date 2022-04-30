# <!-- {docsify-ignore} -->

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

foca 基于 redux 深度定制，所以 state 必须是个纯对象或者数组。

```typescript
// 1
cosnt initialState: { [K: string]: string } = {};
defineModel('model-object', {
  initialState,
});

// 2
cosnt initialState: number[] = [];
defineModel('model-array', {
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
      this.setState(users);
    },
    async retrieve(id: number) {
      const user = await http.get<UserItem>(`/users/${id}`);
      this.setState((state) => {
        state.push(user);
      });
    },
  },
});
```

瞧见没，你可以在 effects 里自由地使用 async/await 方案，然后通过`this.setState`快速更新 state。

现在你需要知道 setState 有三种调用方式：

1. 直接传递新的且完整的 state。
2. 通过回调函数更新 state 的部分数据，而且不用返回。
3. 通过回调函数返回新的且完整的 state。

但是你压根就不想用`setState`，你觉得这样看起来很混乱？OK，你突然想起可以使用 actions 去改变 state 不是吗？

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
      // 调用actions里的函数
      this.addUser(user);
    },
  },
});
```

好吧，这样看起来更纯粹一些，代价就是要委屈你多写几行代码了。

# Computed

对于一些数据，其实是需要经过比较冗长的拼接或者复杂的计算才能得出结果，同时你想自动缓存这些结果？来吧，展示：

```typescript
const initialState = {
  firstName: 'tick',
  lastName: 'tock',
  age: 0,
};

const userModel = defineModel('users', {
  initialState,
  computed: {
    fullName() {
      return this.state.firstName + '.' + this.state.lastName;
    },
  },
});
```

我们可以在任意地方使用计算属性，也可以在 hooks 中使用：

```typescript
// 实时
userModel.fullName; // ComputedRef<string>
userModel.fullName.value; // string
// hooks
useComputed(userModel.fullName); // string
```

计算属性什么时候才会更新？框架自动收集依赖，只有其中某个依赖更新了，计算属性才会更新。上面的例子中，当`firstName`或者`lastName`有变化时，fullName 将被标记为`dirty`状态，下一次访问则会重新计算结果。而当`age`变化时，不影响 fullName 的结果，下一次访问仍使用缓存作为结果。

!> 可以在 computed 中使用其它 model 的数据。
