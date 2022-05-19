# <!-- {docsify-ignore} -->

# Model

You may fed up with redux boilerplate code, it waste your time and you are always repeating yourself. For better type checking and less code, try to define a model now:

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

You have defined a simple model, with **export** keyword, userModel can be imported to react component file.

!> foca will relate model and store automatically.

# State

foca is based on redux, that means state is also `plain object` or `array`.

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

How do you change state? no way except actions. consider usage below:

```typescript
export const userModel = defineModel('users', {
  initialState: [],
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

That's it, this model is interactive now. Then let me tell you how to use action:

- The first parameter of action is always state with intelligent type check.
- Customized parameters length as normal function.
- Mutate state directly, thanks to [immer](https://github.com/immerjs/immer).
- It's not necessary to return state unless you are creating a new state.
- If you want to use `this` context, do ~~not use arrow function~~.

# Effects

In real world, you always want to fetch data from remote server, and then save to state. Let's try effect function.

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

# Events

每个模型都有针对自身的事件回调，在某些复杂的业务场景下，事件和其它属性的组合将变得十分灵活。

## onInit

当 store 初始化完成 并且持久化（如果有）数据已经恢复时，onInit 就会被自动触发。你可以调用 effects 或者 actions 做一些额外操作。

```typescript
import { defineModel } from 'foca';

// 如果是持久化的模型，则初始值不一定是0
const initialState = { count: 0 };

export const myModel = defineModel('my', {
  initialState,
  actions: {
    add(state, step: number) {
      state.count += step;
    },
  },
  effects: {
    async requestApi() {
      const result = await http.get('/path/to');
      // ...
    },
  },
  events: {
    onInit() {
      this.add(10);
      this.requestApi();
    },
  },
});
```

## onChange

每当 state 有变化时的回调通知。初始化(onInit)执行之前不会触发该回调。如果在 onInit 中做了修改 state 的操作，则会触发该回调。

```typescript
import { defineModel } from 'foca';

const initialState = { count: 0 };

export const testModel = defineModel('test', {
  initialState,
  actions: {
    add(state, step: number) {
      state.count += step;
    },
  },
  effects: {
    _notify() {
      // do something
    },
  },
  events: {
    onChange(prevState, nextState) {
      if (prevState.count !== nextState.count) {
        // Looks like a watcher.
        this._notify();
      }
    },
  },
});
```
