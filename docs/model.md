# <!-- {docsify-ignore} -->

# Model

原生的 redux 由 action/type/reducer 三个部分组成，大多数情况我们会分成 3 个文件分别存储。在实际使用中，这种模板式的书写方式不仅繁琐，而且难以将他们关联起来，类型提示就更麻烦了。

基于此，我们提出了模型概念，以 state 为核心，任何更改 state 的操作都应该放在一起。

```typescript
// models/user.model.ts
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

你已`defineModel`经定义了一个最基础的模型，其中第一个字符串参数为redux中的`唯一标识`，请确保其它模型不会再使用这个名字。

对了，怎么注册到store？躺着别动！foca 已经自动把模型注册到 store 中心，也让你享受一下 **DRY** <small>(Don't Repeat Yourself)</small> 原则，因此在业务文件内直接导入模型就能使用。

# State

foca 基于 redux 深度定制，所以 state 必须是个纯对象或者数组。

```typescript
// 对象
const initialState: { [K: string]: string } = {};
const objModel = defineModel('model-object', {
  initialState,
});

// 数组
const initialState: number[] = [];
const arrayModel = defineModel('model-array', {
  initialState,
});
```

# Reducers

模型光有 state 也不行，你现在拿到的就是一个空数组([])。加点数据上去吧，这时候就要用到 reducers：

```typescript
export const userModel = defineModel('users', {
  initialState,
  reducers: {
    addUser(state, user: UserItem) {
      state.push(user);
    },
    updateName(state, id: number, name: string) {
      const user = state.find((item) => item.id === id);
      if (user) {
        user.name = name;
      }
    },
    removeUser(state, id: number) {
      const index = state.findIndex((item) => item.id === id);
      if (index >= 0) {
        state.splice(index, 1);
      }
    },
    clear() {
      // 返回初始值
      return this.initialState;
    },
  },
});
```

就这么干，你已经赋予了模型生命，你等下可以和它互动了。现在，我们来说说这些 reducers 需要注意的几个点：

- 函数的第一个参数一定是 state ，而且它是能自动识别到类型`State`的，你不用刻意地去指定。
- 函数是可以带多个参数的，这全凭你自己的喜好。
- 函数体内可以直接修改 state 对象（数组也属于对象）里的任何内容，这得益于 [immer](https://github.com/immerjs/immer) 的功劳。
- 函数返回值必须是`State`类型。当然你也可以不返回，这时 foca 会认为你正在直接修改 state。
- 如果你想使用`this`上下文，比如上面的 **clear()** 函数返回了初始值，那么请~~不要使用箭头函数~~。

# Methods

不可否认，你的数据不可能总是凭空捏造，在真实的业务场景中，数据总是通过接口获得，然后保存到 state 中。foca 贴心地为你准备了组合逻辑的函数，快来试试吧：

```typescript
const userModel = defineModel('users', {
  initialState,
  methods: {
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

瞧见没，你可以在 methods 里自由地使用 async/await 方案，然后通过`this.setState`快速更新 state。

接下来我们说说`setState`，这其实完全就是 reducers 的快捷方式，你可以直接传入数据或者使用匿名函数来操作，十分方便。这不禁让我们想起了 React Component 里的 setState？咳咳～～读书人的事，那能叫抄吗？

<!-- tabs:start -->

#### ** 直接修改 **

依赖 immer 的能力，你可以直接修改回调函数给的 state 参数，这也是框架最推荐的方式

```typescript
this.setState((state) => {
  state.b = 2;
});

this.setState((state) => {
  state.push('a');
  state.shift();
});
```

#### ** 部分更新 **

是的，你可以返回一部分数据，而且这个特性很简洁高效，框架会使用`Object.assign`帮你把剩余的属性加回去。

!> 只针对 object 类型，而且只有第一级属性可以缺省（参考 React Class Component）

```typescript
this.setState({ a: 1 });

this.setState((state) => {
  return { a: 1 }; // <==> state.a = 1;
});
```

#### ** 全量更新 **

就是重新设置所有数据

```typescript
this.setState({ a: 1, b: 2 });
this.setState((state) => {
  return { a: 1, b: 2 };
});

this.setState(['a', 'b', 'c']);
this.setState((state) => {
  return ['a', 'b', 'c'];
});

// 重新设置成初始值
this.setState(this.initialState);
```

<!-- tabs:end -->

嗯？你压根就不想用`setState`，你觉得这样看起来很混乱？Hold on，你突然想起可以使用 reducers 去改变 state 不是吗？

```typescript
const userModel = defineModel('users', {
  initialState,
  reducers: {
    addUser(state, user: UserItem) {
      state.push(user);
    },
  },
  methods: {
    async retrieve(id: number) {
      const user = await http.get<UserItem>(`/users/${id}`);
      // 调用reducers里的函数
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
  country: 0,
};

const userModel = defineModel('users', {
  initialState,
  computed: {
    fullName() {
      return this.state.firstName + '.' + this.state.lastName;
    },
    profile(age: number, address?: string) {
      return this.fullName() + age + (address || 'empty');
    },
  },
});
```

恕我直言，有点 Methods 的味道了。味道是这个味道，但是本质不一样，当我们多次执行computed函数时，因为存在缓存的概念，所以不会真正地执行该函数。

```typescript
userModel.fullName(); // 执行函数，生成缓存
userModel.fullName(); // 使用缓存
userModel.fullName(); // 使用缓存
```

带参数的计算属性可以理解为所有参数就是一个key，每个key都会生成一个计算属性实例，互不干扰。

```typescript
userModel.profile(20); // 执行函数，生成实例1缓存
userModel.profile(20); // 实例1缓存
userModel.profile(123); // 执行函数，生成实例2缓存
userModel.profile(123); // 实例2缓存

userModel.profile(20); // 实例1缓存
userModel.profile(123); // 实例2缓存
```

参数尽量使用基本类型，**不建议**使用对象或者数组作为计算属性的实参，因为如果每次都传新建的复合类型，无法起到缓存的效果，执行速度反而变慢，这和`useMemo(callback, deps)`函数的第二个参数（依赖项）是一个原理。如果实在想用复合类型作为参数，不烦考虑一下放到`Methods`里？

---

缓存什么时候才会更新？框架自动收集依赖，只有其中某个依赖更新了，计算属性才会更新。上面的例子中，当`firstName`或者`lastName`有变化时，fullName 将被标记为`dirty`状态，下一次访问则会重新计算结果。而当`country`变化时，不影响 fullName 的结果，下一次访问仍使用缓存作为结果。

!> 可以在 computed 中使用其它 model 的数据。
