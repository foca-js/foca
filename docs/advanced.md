# <!-- {docsify-ignore} -->

# 克隆模型

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

克隆时支持修改 `initialState, events, persist, skipRefresh` 这些属性

```typescript
const user3Model = cloneModel('users3', userModel, {
  initialState: {...},
  ...
});

const user3Model = cloneModel('users3', userModel, (prev) => {
  return {
    initialState: {
      ...prev.initialState,
      customData: 'xyz',
    },
    ...
  }
});
```

# loadings

默认地，methods 函数只会保存一份执行状态，如果你在同一时间多次执行同一个函数，那么状态就会互相覆盖，产生错乱的数据。如果现在有 10 个按钮，点击每个按钮都会执行`model.methodX(id)`，那么我们如何知道是哪个按钮执行的呢？这时候我们需要为执行状态开辟一个独立的存储空间，让同一个函数拥有多个状态互不干扰。

```tsx
import { useLoading } from 'foca';

const App: FC = () => {
  const loadings = useLoading(model.myMethod.room);

  const handleClick = (id: number) => {
    model.myMethod.room(id).execute(id);
  };

  return (
    <div>
      <button onClick={() => handleClick(1)}>
        A {loadings.find(1) ? 'Loading...' : ''}
      </button>
      <button onClick={() => handleClick(2)}>
        B {loadings.find(2) ? 'Loading...' : ''}
      </button>
      <button onClick={() => handleClick(3)}>
        C {loadings.find(3) ? 'Loading...' : ''}
      </button>
    </div>
  );
};
```

这种场景也常出现在一些表格里，每一行通常都带有切换（switch UI）控件，点击后该控件需要被禁用或者出现 loading 图标，提前是你得知道是谁。

如果你能确定 find 的参数，那么也可以直接传递：

```typescript
// 适用于明确地知道编号的场景，比如是从组件props直接传入
const loading = useLoading(model.myMethod.room, 100); // boolean

// 适用于列表，编号只能在for循环中获取的场景
const loadings = useLoading(model.myMethod.room);
list.forEach(({ id }) => {
  const loading = loadings.find(id);
});
```

# 重置所有数据

当用户退出登录时，你需要清理与用户相关的一些数据，然后把页面切换到`登录页`。清理操作其实是比较麻烦的，首先 model 太多了，然后就是后期也可能再增加其它模型，不可能手动一个个清理。这时候可以用上 store 自带的方法：

```diff
import { store } from 'foca';

// onLogout是你的业务方法
onLogout().then(() => {
+ store.refresh();
});
```

一个方法就能把所有数据都恢复成初始值状态，太方便了吧？

重置时，你也可以保留部分模型的数据不被影响（可能是一些全局的配置数据），在相应的模型下加入关键词`skipRefresh`即可：

```diff
defineModel('my-global-model', {
  initialState: {},
+ skipRefresh: true,
});
```

对了，如果你实在是想无情地删除所有数据（即无视 skipRefresh 参数），那么就用`强制模式`好了：

```typescript
store.refresh(true);
```

# 私有方法

我们总是会想抽出一些逻辑作为独立的方法调用，但又不想暴露给模型外部使用，而且方法一多，调用方法时 TS 会提示长长的一串方法列表，显得十分混乱。是时候声明一些私有方法了，foca 使用约定俗成的`前置下划线(_)`来代表私有方法

```typescript
const userModel = defineModel('users', {
  initialState,
  reducers: {
    addUser(state, user: UserItem) {},
    _deleteUser(state, userId: number) {},
  },
  methods: {
    async retrieve(id: number) {
      const user = await http.get<UserItem>(`/users/${id}`);
      this.addUser(user);

      // 私有reducers方法
      this._deleteUser(15);
      // 私有methods方法
      this._myLogic();
      // 私有computed变量
      this._fullname.value;
    },
    async _myLogic() {},
  },
  computed: {
    _fullname() {},
  },
});

userModel.retrieve; // OK
userModel._deleteUser; // 报错了，找不到属性 _deleteUser
userModel._myLogic; // 报错了，找不到属性 _myLogic
userModel._fullname; // 报错了，找不到属性 _fullname
```

对外接口变得十分清爽，减少出错概率的同时，也提升了数据的安全性。
