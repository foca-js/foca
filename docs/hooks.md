#

# useModel

你绝对想不到获取一个模型的数据有多简单，试试：

```tsx
// File: App.tsx
import { FC } from 'react';
import { useModel } from 'foca';
import { userModel } from './userModel';

const App: FC = () => {
  const users = useModel(userModel);

  return (
    <>
      {users.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </>
  );
};

export default App;
```

就这么一小行，朴实无华，你也可以对数据进行改造，返回你当前需要的数据：

```typescript
const userIds = useModel(userModel, (state) => state.map((item) => item.id));
```

不错，你拿到了所有用户的 id 编号，同时 userIds 的类型会自动推断为`number[]`。

!> 只要 useModel() 返回的最终值不变，就不会触发 react 组件刷新。foca 使用 **深对比** 来判断值是否变化。

---

等等，事情还没结束！useModel 还能增加更多模型上去，这样可以少用几个 hooks：

```typescript
const { users, agents, teachers } = useModel(
  userModel,
  agentModel,
  teacherModel,
);
```

传递超过一个模型作为参数时，返回值将变成对象，而 key 就是模型的名称，value 就是模型的 state。这很酷，而且你仍然不用担心类型的问题。

如果你有一些数据需要多个模型才能计算出来，那么现在就是 useModel 大展身手的时候了：

```typescript
const count = useModel(
  userModel,
  agentModel,
  teacherModel,
  (users, agents, teachers) => users.length + agents.length + teachers.length,
);
```

返回的是一个数字，如假包换，TS 也自动推导出来了这是`number`类型

# useLoading

effects 函数大部分是异步的，你可能正在函数里执行一个请求 api 的操作。在用户等待期间，你需要为用户渲染`loading...`之类的字样或者图标以缓解用户的焦虑心情。利用 foca 提供的逻辑，你可以轻松地知道某个函数是否正在执行：

```tsx
import { useLoading } from 'foca';

const App: FC = () => {
  const loading = useLoading(userModel.getUser);

  const handleClick = () => {
    userModel.getUser(1);
  };

  return <div onClick={handleClick}>{loading ? 'loading...' : 'OK'}</div>;
};
```

每次开始执行`getUser`函数，loading 自动变成`true`，从而触发组件刷新。

在某些编辑表单的场景，很可能会同时有新增和修改两种操作。对于 restful API，你需要写两个异步函数来处理请求。但你的表单保存按钮只有一个，很显然不管是新增还是修改，你都想让保存按钮渲染`保存中...`的字样。

为了减少业务代码，useLoading 允许你传入多个异步函数，只要有任何一个函数在执行，那么最终值就会是 true。

```typescript
const loading = useLoading(userModel.create, userModel.update, ...);
```

# useComputed

配合 computed 计算属性使用。

```tsx
import { useComputed } from 'foca';

// 假设有这么一个model
const userModel = defineModel('user', {
  initialState: {
    firstName: 'tick',
    lastName: 'tock',
  },
  computed: {
    fullName() {
      return this.state.firstName + '.' + this.state.lastName;
    },
  },
});

const App: FC = () => {
  // 只有当 firstName 或者 lastName 变化，才会重新刷新该组件
  const fullName = useComputed(userModel.fullName);

  return <div>{fullName}</div>;
};
```
